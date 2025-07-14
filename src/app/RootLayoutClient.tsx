"use client";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { useState } from "react";

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Topbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#111827]">
          {children}
        </main>
      </div>
    </div>
  );
}