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
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- Allow for other properties not explicitly defined
}

export type RegulatoryData = RegulatoryDataItem[];

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