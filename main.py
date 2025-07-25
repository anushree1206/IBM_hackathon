from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from typing import Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "winova")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# SMTP configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "your-email@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "your-app-password")

# MongoDB setup
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]
users_collection = db.users
settings_collection = db.user_settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

app = FastAPI(title="Winova API", version="1.0.0")

# --- Cost-Benefit Analysis Endpoint ---
@app.post("/cost-benefit-analysis/analyze")
async def analyze_cost_benefit(file: UploadFile = File(...)):
    import io
    import pandas as pd
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))
    required_cols = {"company", "strategy", "cost", "projected_savings", "waste_reduction"}
    if not required_cols.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_cols)}")
    results = []
    companies = df['company'].unique().tolist()
    for company in companies:
        company_df = df[df['company'] == company]
        options = []
        for _, row in company_df.iterrows():
            roi = (row['projected_savings'] - row['cost']) / row['cost'] * 100 if row['cost'] else 0
            options.append({
                "strategy": row['strategy'],
                "cost": row['cost'],
                "savings": row['projected_savings'],
                "waste_reduction": row['waste_reduction'],
                "roi": round(roi, 2)
            })
        sorted_options = sorted(options, key=lambda x: x['roi'], reverse=True)
        top = sorted_options[0] if sorted_options else {}
        company_data = {
            "initialCost": f"${top['cost']:,}" if top else "",
            "annualSavings": f"${top['savings']:,}" if top else "",
            "roi": f"{top['roi']}%" if top else "",
            "paybackPeriod": "",  # Add if available in CSV
            "implementationTime": ""  # Add if available in CSV
        }
        results.append({
            "company": company,
            "companyData": company_data,
            "roiRankings": sorted_options,
            "strategies": sorted_options,
            "recommendations": [
                f"Best strategy: {top['strategy']}" if top else "No strategies found."
            ] if top else [],
        })
    # Return companies list for dropdown
    return {"results": results, "companies": companies}

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class SettingsUpdate(BaseModel):
    theme: Optional[str] = None  # 'dark', 'light', 'auto'
    notifications: Optional[bool] = None
    language: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Password utilities
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    # Convert ObjectId to string for JSON serialization
    user["id"] = str(user["_id"])
    return user

# Email utility

def send_email(to_email, subject, body):
    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
    except Exception as e:
        print(f"Error sending email: {e}")

# API Endpoints
@app.post("/register", response_model=UserResponse)
def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    
    # Create default settings
    settings_doc = {
        "user_id": str(result.inserted_id),
        "theme": "dark",
        "notifications": True,
        "language": "en"
    }
    settings_collection.insert_one(settings_doc)
    
    # Send welcome email if notifications enabled
    if settings_doc["notifications"]:
        send_email(
            user_data.email,
            "Welcome to Winova!",
            f"Hello {user_data.full_name or user_data.email},\n\nWelcome to Winova! Your account has been created successfully.\n\nBest regards,\nWinova Team"
        )
    
    return user_doc

@app.post("/login", response_model=Token)
def login(user_data: UserLogin):
    # Find user
    user = users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    # Convert ObjectId to string for JSON serialization
    user["id"] = str(user["_id"])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/profile", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@app.put("/profile", response_model=UserResponse)
def update_profile(
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Update user data
    update_data = {"updated_at": datetime.utcnow()}
    
    if user_data.full_name is not None:
        update_data["full_name"] = user_data.full_name
    if user_data.email is not None:
        # Check if email is already taken
        existing_user = users_collection.find_one({
            "email": user_data.email, 
            "_id": {"$ne": ObjectId(current_user["id"])}
        })
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already taken")
        update_data["email"] = user_data.email
    
    users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = users_collection.find_one({"_id": ObjectId(current_user["id"])})
    updated_user["id"] = str(updated_user["_id"])
    
    return updated_user

@app.get("/settings")
def get_settings(current_user: dict = Depends(get_current_user)):
    settings = settings_collection.find_one({"user_id": current_user["id"]})
    if not settings:
        # Create default settings
        settings_doc = {
            "user_id": current_user["id"],
            "theme": "dark",
            "notifications": True,
            "language": "en"
        }
        settings_collection.insert_one(settings_doc)
        settings = settings_doc
    
    return {
        "theme": settings.get("theme", "dark"),
        "notifications": settings.get("notifications", True),
        "language": settings.get("language", "en")
    }

@app.put("/settings")
def update_settings(
    settings_data: SettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    
    if settings_data.theme is not None:
        update_data["theme"] = settings_data.theme
    if settings_data.notifications is not None:
        update_data["notifications"] = settings_data.notifications
    if settings_data.language is not None:
        update_data["language"] = settings_data.language
    
    if update_data:
        settings_collection.update_one(
            {"user_id": current_user["id"]},
            {"$set": update_data},
            upsert=True
        )
        # If notifications enabled and email changed, send notification
        if update_data.get("notifications"):
            user = users_collection.find_one({"_id": ObjectId(current_user["id"])})
            send_email(
                user["email"],
                "Winova Notification Enabled",
                f"Hello {user.get('full_name', user['email'])},\n\nEmail notifications have been enabled for your account.\n\nBest regards,\nWinova Team"
            )
    
    # Get updated settings
    settings = settings_collection.find_one({"user_id": current_user["id"]})
    
    return {
        "theme": settings.get("theme", "dark"),
        "notifications": settings.get("notifications", True),
        "language": settings.get("language", "en")
    }

import io
import pandas as pd
from fastapi import UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse

# Dashboard endpoints

@app.post("/compliance-risk-calculator/analyze")
async def analyze_compliance(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))
    required_cols = {"company_name", "compliance_cost", "penalty_cost"}
    if not required_cols.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_cols)}")

    # --- Existing company risk logic ---
    def calculate_risk(company_name, compliance_cost, penalty_cost):
        savings = penalty_cost - compliance_cost
        decision = "Fix Compliance Issue" if compliance_cost < penalty_cost else "Accept Penalty"
        return {
            "company": company_name,
            "compliance_cost": compliance_cost,
            "penalty_cost": penalty_cost,
            "savings_if_fixed": savings,
            "recommended_action": decision
        }
    def prioritize_by_impact(risks):
        return sorted(risks, key=lambda x: x['savings_if_fixed'], reverse=True)
    risk_reports = [
        calculate_risk(row['company_name'], row['compliance_cost'], row['penalty_cost'])
        for _, row in df.iterrows()
    ]
    prioritized = prioritize_by_impact(risk_reports)

    return JSONResponse(content={
        "results": prioritized
    })

@app.post("/compliance-risk-calculator/download")
async def download_compliance_report(file: UploadFile = File(...)):
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))
    required_cols = {"company_name", "compliance_cost", "penalty_cost"}
    if not required_cols.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_cols)}")
    def calculate_risk(company_name, compliance_cost, penalty_cost):
        savings = penalty_cost - compliance_cost
        decision = "Fix Compliance Issue" if compliance_cost < penalty_cost else "Accept Penalty"
        return {
            "company": company_name,
            "compliance_cost": compliance_cost,
            "penalty_cost": penalty_cost,
            "savings_if_fixed": savings,
            "recommended_action": decision
        }
    def prioritize_by_impact(risks):
        return sorted(risks, key=lambda x: x['savings_if_fixed'], reverse=True)
    risk_reports = [
        calculate_risk(row['company_name'], row['compliance_cost'], row['penalty_cost'])
        for _, row in df.iterrows()
    ]
    prioritized = prioritize_by_impact(risk_reports)
    result_df = pd.DataFrame(prioritized)
    stream = io.StringIO()
    result_df.to_csv(stream, index=False)
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=compliance_risk_output.csv"
    return response
@app.get("/dashboard")
def dashboard():
    return {
        "summary": "Dashboard data",
        "stats": {
            "users": 150,
            "alerts": 3,
            "compliance": "Good",
            "carbon_footprint": 12345
        }
    }

@app.get("/compliance-alerts")
def compliance_alerts():
    return {
        "alerts": [
            {"id": 1, "level": "High", "message": "CO2 threshold exceeded", "date": "2024-01-15"},
            {"id": 2, "level": "Medium", "message": "Upcoming regulation deadline", "date": "2024-01-20"},
            {"id": 3, "level": "Low", "message": "Monthly report due", "date": "2024-01-25"}
        ]
    }

@app.get("/carbon-analysis")
def carbon_analysis():
    return {
        "analysis": {
            "total_emissions": 12345,
            "trend": "decreasing",
            "recommendation": "Continue current strategy",
            "monthly_data": [
                {"month": "Jan", "emissions": 12000},
                {"month": "Feb", "emissions": 11800},
                {"month": "Mar", "emissions": 11500}
            ]
        }
    }

@app.get("/regulatory-scanner")
def regulatory_scanner():
    return {
        "regulations": [
            {"id": 1, "name": "EU ETS", "status": "Compliant", "next_review": "2024-06-15"},
            {"id": 2, "name": "US EPA", "status": "Pending", "next_review": "2024-04-20"},
            {"id": 3, "name": "UK Carbon Tax", "status": "Compliant", "next_review": "2024-08-10"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 