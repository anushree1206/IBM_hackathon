"use client";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Don't show sidebar on landing page
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#111827] text-white font-sans">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#111827]">
        {children}
      </main>
    </div>
  );
}