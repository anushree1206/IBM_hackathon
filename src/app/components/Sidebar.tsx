"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", badge: null },
  { name: "Compliance Alerts", href: "/compliance-alerts", badge: 3 },
  { name: "Carbon Analysis", href: "/carbon-analysis", badge: null },
  { name: "Report Generator", href: "/report-generator", badge: null },
  { name: "Reports", href: "/reports", badge: null },
  { name: "Regulatory Scanner", href: "/regulatory-scanner", badge: null },
  { name: "Compliance Risk Calculator", href: "/compliance-risk-calculator", badge: null },
  { name: "Cost-Benefit Analysis", href: "/cost-benefit-analysis", badge: null },
  { name: "What-If Calculator", href: "/what-if-calculator", badge: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-[#151c27] text-white w-64 min-h-screen flex flex-col py-6 px-4 shadow-lg">
      <Link href="/">
        <div className="text-2xl font-bold mb-10 tracking-tight cursor-pointer">CarbonGuard <span className="text-xs font-normal text-gray-400 ml-1"></span></div>
      </Link>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium text-base ${
                    isActive
                      ? "bg-[#22304a] text-blue-400"
                      : "hover:bg-[#22304a] text-gray-200"
                  }`}
                >
                  {link.name}
                  {link.badge && (
                    <span className="ml-auto bg-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">{link.badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto text-xs text-gray-500 pt-8">© 2025 CarbonGuard Inc.</div>
    </aside>
  );
}