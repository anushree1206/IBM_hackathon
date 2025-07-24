"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface RegulatoryDataItem {
  Industry?: string;
  Emissions?: string;
  Due?: string;
  Deadline?: string;
  Regulation?: string;
  Compliance?: string;
  Status?: string;
  emissions?: string;
  industry?: string;
  [key: string]: any; 
}

export type RegulatoryData = RegulatoryDataItem[];

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

interface RegulatoryDataContextType {
  data: RegulatoryData;
  setData: (data: RegulatoryData) => void;
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const RegulatoryDataContext = createContext<RegulatoryDataContextType | undefined>(undefined);

export function RegulatoryDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RegulatoryData>([]);
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <RegulatoryDataContext.Provider value={{ data, setData, user, login, logout }}>
      {children}
    </RegulatoryDataContext.Provider>
  );
}

export function useRegulatoryData() {
  const context = useContext(RegulatoryDataContext);
  if (!context) {
    throw new Error("useRegulatoryData must be used within a RegulatoryDataProvider");
  }
  return context;
}