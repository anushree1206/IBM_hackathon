"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type RegulatoryData = any[]; // Replace 'any' with a more specific type if known

interface RegulatoryDataContextType {
  data: RegulatoryData;
  setData: (data: RegulatoryData) => void;
}

const RegulatoryDataContext = createContext<RegulatoryDataContextType | undefined>(undefined);

export function RegulatoryDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RegulatoryData>([]);
  return (
    <RegulatoryDataContext.Provider value={{ data, setData }}>
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