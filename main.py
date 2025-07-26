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

class AlertSchedule(BaseModel):
    alert_type: str  # 'compliance_deadline', 'report_generation', 'data_review'
    title: str
    description: str
    trigger_date: datetime
    advance_days: int = 7  # Days before the actual deadline to trigger
    recurrence: Optional[str] = None  # 'daily', 'weekly', 'monthly', 'yearly'
    priority: str = 'medium'  # 'low', 'medium', 'high', 'critical'
    enabled: bool = True

class ReportSchedule(BaseModel):
    report_type: str  # 'compliance', 'carbon_analysis', 'regulatory_summary'
    title: str
    schedule_cron: str  # Cron expression for scheduling
    recipients: List[str] = []  # Email addresses
    enabled: bool = True
    include_charts: bool = True

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
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
import threading
from typing import List, Dict, Any
import json
from datetime import timedelta

# Initialize scheduler for proactive alerts
scheduler = BackgroundScheduler()
scheduler.start()

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
            {"id": 1, "type": "High", "message": "EU ETS deadline approaching", "date": "2024-03-15"},
            {"id": 2, "type": "Medium", "message": "Carbon tax filing due", "date": "2024-04-01"}
        ]
    }

# Proactive Alert System Functions
def trigger_proactive_alert(alert_data: dict):
    """Function to trigger proactive alerts"""
    try:
        print(f"🚨 Triggering proactive alert: {alert_data['title']}")
        
        # Store alert in database
        alerts_collection = db.proactive_alerts
        alert_document = {
            "user_id": alert_data.get("user_id"),
            "alert_type": alert_data.get("alert_type"),
            "title": alert_data.get("title"),
            "description": alert_data.get("description"),
            "priority": alert_data.get("priority", "medium"),
            "triggered_at": datetime.utcnow(),
            "status": "active",
            "read": False
        }
        
        result = alerts_collection.insert_one(alert_document)
        print(f"✅ Alert stored with ID: {result.inserted_id}")
        
        # Send email notification if configured
        if alert_data.get("send_email", True):
            user_email = alert_data.get("user_email")
            if user_email:
                send_email(
                    user_email,
                    f"Proactive Alert: {alert_data['title']}",
                    f"Alert Details:\n\n{alert_data['description']}\n\nPriority: {alert_data['priority'].upper()}\n\nTriggered at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
                )
                print(f"📧 Email notification sent to {user_email}")
        
        return True
    except Exception as e:
        print(f"❌ Error triggering proactive alert: {str(e)}")
        return False

def generate_automated_report(report_config: dict):
    """Function to generate automated reports"""
    try:
        print(f"📊 Generating automated report: {report_config['title']}")
        
        user_id = report_config.get("user_id")
        report_type = report_config.get("report_type")
        
        # Get user's regulatory data
        regulatory_collection = db.regulatory_data
        user_data = list(regulatory_collection.find({"user_id": user_id}))
        
        if not user_data:
            print(f"⚠️ No data found for user {user_id}")
            return False
        
        # Generate report based on type
        report_content = {}
        
        if report_type == "compliance":
            # Analyze compliance status
            all_records = []
            for upload in user_data:
                all_records.extend(upload.get("data", []))
            
            report_content = {
                "report_type": "Compliance Summary",
                "generated_at": datetime.utcnow().isoformat(),
                "total_records": len(all_records),
                "compliance_status": "Under Review",
                "recommendations": [
                    "Review upcoming compliance deadlines",
                    "Update regulatory data regularly",
                    "Monitor regulatory changes"
                ]
            }
        
        elif report_type == "carbon_analysis":
            report_content = {
                "report_type": "Carbon Analysis",
                "generated_at": datetime.utcnow().isoformat(),
                "carbon_footprint": "Analysis in progress",
                "recommendations": [
                    "Implement carbon reduction strategies",
                    "Monitor emissions regularly"
                ]
            }
        
        # Store report in database
        reports_collection = db.automated_reports
        report_document = {
            "user_id": user_id,
            "report_type": report_type,
            "title": report_config.get("title"),
            "content": report_content,
            "generated_at": datetime.utcnow(),
            "status": "completed"
        }
        
        result = reports_collection.insert_one(report_document)
        print(f"✅ Report stored with ID: {result.inserted_id}")
        
        # Send report via email if configured
        recipients = report_config.get("recipients", [])
        if recipients:
            report_text = json.dumps(report_content, indent=2)
            for recipient in recipients:
                send_email(
                    recipient,
                    f"Automated Report: {report_config['title']}",
                    f"Report Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n{report_text}"
                )
                print(f"📧 Report sent to {recipient}")
        
        return True
    except Exception as e:
        print(f"❌ Error generating automated report: {str(e)}")
        return False

# API Endpoints for Proactive Alerts and Reports
@app.post("/proactive-alerts/schedule")
async def schedule_proactive_alert(
    alert_schedule: AlertSchedule,
    current_user: dict = Depends(get_current_user)
):
    """Schedule a proactive alert"""
    try:
        # Calculate trigger time (advance_days before the actual date)
        trigger_time = alert_schedule.trigger_date - timedelta(days=alert_schedule.advance_days)
        
        if trigger_time <= datetime.utcnow():
            # If trigger time is in the past, trigger immediately
            alert_data = {
                "user_id": current_user["id"],
                "user_email": current_user.get("email"),
                "alert_type": alert_schedule.alert_type,
                "title": alert_schedule.title,
                "description": alert_schedule.description,
                "priority": alert_schedule.priority
            }
            trigger_proactive_alert(alert_data)
            
            return {
                "success": True,
                "message": "Alert triggered immediately (past due date)",
                "triggered_at": datetime.utcnow().isoformat()
            }
        
        # Schedule the alert
        job_id = f"alert_{current_user['id']}_{int(trigger_time.timestamp())}"
        
        alert_data = {
            "user_id": current_user["id"],
            "user_email": current_user.get("email"),
            "alert_type": alert_schedule.alert_type,
            "title": alert_schedule.title,
            "description": alert_schedule.description,
            "priority": alert_schedule.priority
        }
        
        if alert_schedule.recurrence:
            # Schedule recurring alert
            if alert_schedule.recurrence == "daily":
                scheduler.add_job(
                    trigger_proactive_alert,
                    CronTrigger(hour=trigger_time.hour, minute=trigger_time.minute),
                    args=[alert_data],
                    id=job_id,
                    replace_existing=True
                )
            elif alert_schedule.recurrence == "weekly":
                scheduler.add_job(
                    trigger_proactive_alert,
                    CronTrigger(day_of_week=trigger_time.weekday(), hour=trigger_time.hour, minute=trigger_time.minute),
                    args=[alert_data],
                    id=job_id,
                    replace_existing=True
                )
            elif alert_schedule.recurrence == "monthly":
                scheduler.add_job(
                    trigger_proactive_alert,
                    CronTrigger(day=trigger_time.day, hour=trigger_time.hour, minute=trigger_time.minute),
                    args=[alert_data],
                    id=job_id,
                    replace_existing=True
                )
        else:
            # Schedule one-time alert
            scheduler.add_job(
                trigger_proactive_alert,
                DateTrigger(run_date=trigger_time),
                args=[alert_data],
                id=job_id,
                replace_existing=True
            )
        
        # Store schedule in database
        schedules_collection = db.alert_schedules
        schedule_document = {
            "user_id": current_user["id"],
            "job_id": job_id,
            "alert_type": alert_schedule.alert_type,
            "title": alert_schedule.title,
            "description": alert_schedule.description,
            "trigger_date": alert_schedule.trigger_date,
            "advance_days": alert_schedule.advance_days,
            "recurrence": alert_schedule.recurrence,
            "priority": alert_schedule.priority,
            "enabled": alert_schedule.enabled,
            "created_at": datetime.utcnow()
        }
        
        result = schedules_collection.insert_one(schedule_document)
        
        return {
            "success": True,
            "message": "Proactive alert scheduled successfully",
            "schedule_id": str(result.inserted_id),
            "trigger_time": trigger_time.isoformat(),
            "job_id": job_id
        }
        
    except Exception as e:
        print(f"❌ Error scheduling proactive alert: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error scheduling proactive alert: {str(e)}"
        )

@app.post("/automated-reports/schedule")
async def schedule_automated_report(
    report_schedule: ReportSchedule,
    current_user: dict = Depends(get_current_user)
):
    """Schedule automated report generation"""
    try:
        job_id = f"report_{current_user['id']}_{report_schedule.report_type}_{int(datetime.utcnow().timestamp())}"
        
        report_config = {
            "user_id": current_user["id"],
            "report_type": report_schedule.report_type,
            "title": report_schedule.title,
            "recipients": report_schedule.recipients,
            "include_charts": report_schedule.include_charts
        }
        
        # Parse cron expression and schedule job
        cron_parts = report_schedule.schedule_cron.split()
        if len(cron_parts) == 5:
            minute, hour, day, month, day_of_week = cron_parts
            
            scheduler.add_job(
                generate_automated_report,
                CronTrigger(
                    minute=minute,
                    hour=hour,
                    day=day,
                    month=month,
                    day_of_week=day_of_week
                ),
                args=[report_config],
                id=job_id,
                replace_existing=True
            )
        else:
            raise ValueError("Invalid cron expression. Expected format: 'minute hour day month day_of_week'")
        
        # Store schedule in database
        report_schedules_collection = db.report_schedules
        schedule_document = {
            "user_id": current_user["id"],
            "job_id": job_id,
            "report_type": report_schedule.report_type,
            "title": report_schedule.title,
            "schedule_cron": report_schedule.schedule_cron,
            "recipients": report_schedule.recipients,
            "enabled": report_schedule.enabled,
            "include_charts": report_schedule.include_charts,
            "created_at": datetime.utcnow()
        }
        
        result = report_schedules_collection.insert_one(schedule_document)
        
        return {
            "success": True,
            "message": "Automated report scheduled successfully",
            "schedule_id": str(result.inserted_id),
            "job_id": job_id,
            "next_run": "Based on cron schedule"
        }
        
    except Exception as e:
        print(f"❌ Error scheduling automated report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error scheduling automated report: {str(e)}"
        )

@app.get("/proactive-alerts")
async def get_proactive_alerts(current_user: dict = Depends(get_current_user)):
    """Get all proactive alerts for the current user"""
    try:
        alerts_collection = db.proactive_alerts
        alerts = list(alerts_collection.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).sort("triggered_at", -1).limit(50))
        
        return {
            "success": True,
            "alerts": alerts,
            "count": len(alerts)
        }
        
    except Exception as e:
        print(f"❌ Error retrieving proactive alerts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving proactive alerts: {str(e)}"
        )

@app.get("/alert-schedules")
async def get_alert_schedules(current_user: dict = Depends(get_current_user)):
    """Get all alert schedules for the current user"""
    try:
        schedules_collection = db.alert_schedules
        schedules = list(schedules_collection.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).sort("created_at", -1))
        
        return {
            "success": True,
            "schedules": schedules,
            "count": len(schedules)
        }
        
    except Exception as e:
        print(f"❌ Error retrieving alert schedules: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving alert schedules: {str(e)}"
        )

@app.get("/automated-reports")
async def get_automated_reports(current_user: dict = Depends(get_current_user)):
    """Get all automated reports for the current user"""
    try:
        reports_collection = db.automated_reports
        reports = list(reports_collection.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).sort("generated_at", -1).limit(20))
        
        return {
            "success": True,
            "reports": reports,
            "count": len(reports)
        }
        
    except Exception as e:
        print(f"❌ Error retrieving automated reports: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving automated reports: {str(e)}"
        )

@app.post("/proactive-alerts/trigger-now")
async def trigger_alert_now(
    alert_type: str,
    title: str,
    description: str,
    priority: str = "medium",
    current_user: dict = Depends(get_current_user)
):
    """Manually trigger a proactive alert immediately"""
    try:
        alert_data = {
            "user_id": current_user["id"],
            "user_email": current_user.get("email"),
            "alert_type": alert_type,
            "title": title,
            "description": description,
            "priority": priority
        }
        
        success = trigger_proactive_alert(alert_data)
        
        if success:
            return {
                "success": True,
                "message": "Alert triggered successfully",
                "triggered_at": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to trigger alert"
            )
            
    except Exception as e:
        print(f"❌ Error triggering alert: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error triggering alert: {str(e)}"
        )

@app.post("/automated-reports/generate-now")
async def generate_report_now(
    report_type: str,
    title: str,
    recipients: List[str] = [],
    current_user: dict = Depends(get_current_user)
):
    """Manually generate an automated report immediately"""
    try:
        report_config = {
            "user_id": current_user["id"],
            "report_type": report_type,
            "title": title,
            "recipients": recipients,
            "include_charts": True
        }
        
        success = generate_automated_report(report_config)
        
        if success:
            return {
                "success": True,
                "message": "Report generated successfully",
                "generated_at": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate report"
            )
            
    except Exception as e:
        print(f"❌ Error generating report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report: {str(e)}"
        )

@app.get("/carbon-analysis")
def carbon_analysis():
{{ ... }}
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

@app.post("/regulatory-scanner/upload")
async def upload_regulatory_data(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and store regulatory scanner CSV data in the database"""
    try:
        print(f"📤 Upload started by user: {current_user.get('email', 'Unknown')}")
        print(f"📁 File: {file.filename}")
        
        # Read and parse CSV file
        content = await file.read()
        print(f"📊 File size: {len(content)} bytes")
        
        df = pd.read_csv(io.BytesIO(content))
        print(f"📋 CSV columns: {list(df.columns)}")
        print(f"📈 CSV rows: {len(df)}")
        
        # Convert DataFrame to list of dictionaries
        regulatory_data = df.to_dict('records')
        
        # Create document to store in MongoDB
        document = {
            "user_id": current_user["id"],
            "filename": file.filename,
            "upload_date": datetime.utcnow(),
            "data": regulatory_data,
            "record_count": len(regulatory_data)
        }
        
        print(f"💾 Storing document with {len(regulatory_data)} records...")
        
        # Store in MongoDB
        regulatory_collection = db.regulatory_data
        result = regulatory_collection.insert_one(document)
        
        print(f"✅ Successfully stored with ID: {result.inserted_id}")
        
        # Verify the data was stored
        verification = regulatory_collection.find_one({"_id": result.inserted_id})
        if verification:
            print(f"✅ Verification successful: Document exists in database")
        else:
            print(f"❌ Verification failed: Document not found in database")
        
        return {
            "success": True,
            "message": f"Successfully uploaded {len(regulatory_data)} records",
            "upload_id": str(result.inserted_id),
            "data": regulatory_data
        }
        
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=400,
            detail=f"Error processing CSV file: {str(e)}"
        )

@app.get("/regulatory-scanner/data")
async def get_regulatory_data(current_user: dict = Depends(get_current_user)):
    """Get all regulatory data uploaded by the current user"""
    try:
        print(f"🔍 Data retrieval requested by user: {current_user.get('email', 'Unknown')}")
        print(f"🆔 User ID: {current_user['id']}")
        
        regulatory_collection = db.regulatory_data
        
        # Check total documents in collection
        total_docs = regulatory_collection.count_documents({})
        print(f"📊 Total documents in regulatory_data collection: {total_docs}")
        
        # Check documents for this user
        user_doc_count = regulatory_collection.count_documents({"user_id": current_user["id"]})
        print(f"👤 Documents for this user: {user_doc_count}")
        
        user_data = list(regulatory_collection.find(
            {"user_id": current_user["id"]},
            {"_id": 0, "data": 1, "filename": 1, "upload_date": 1, "record_count": 1}
        ).sort("upload_date", -1))
        
        print(f"📁 Found {len(user_data)} uploads for user")
        
        # Flatten all data from all uploads
        all_data = []
        for upload in user_data:
            upload_records = upload.get("data", [])
            all_data.extend(upload_records)
            print(f"📄 Upload '{upload.get('filename', 'Unknown')}': {len(upload_records)} records")
        
        print(f"📊 Total flattened records: {len(all_data)}")
        
        return {
            "success": True,
            "data": all_data,
            "uploads": user_data
        }
        
    except Exception as e:
        print(f"❌ Data retrieval error: {str(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving regulatory data: {str(e)}"
        )

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