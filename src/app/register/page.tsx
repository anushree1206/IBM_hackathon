"use client";
import React, { useState, useEffect } from "react";

export default function Topbar({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      fetch("http://localhost:8000/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => setUser(data));
    }
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-4 shadow-sm rounded-b-xl md:px-8">
      <button
        className="text-white md:hidden focus:outline-none"
        onClick={() => setSidebarOpen(true)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <div className="flex-grow" />
      <div className="flex items-center gap-4 relative">
        <select className="bg-[#22304a] text-white px-3 py-1 rounded-lg text-sm font-medium focus:outline-none">
          <option>Acme...</option>
        </select>
        <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg cursor-pointer" onClick={() => setDropdownOpen((open) => !open)}>
          S
        </div>
        {dropdownOpen && (
          <div className="absolute right-0 top-12 bg-white text-black rounded-lg shadow-lg min-w-[180px] z-50 p-4">
            {user ? (
              <>
                <div className="mb-2 font-semibold">{user.full_name || user.email}</div>
                <div className="mb-2 text-xs text-gray-600">{user.email}</div>
                <a href="/settings" className="block py-1 hover:underline">Settings</a>
                <button className="block w-full text-left py-1 text-red-600 hover:underline" onClick={() => { localStorage.removeItem("token"); window.location.reload(); }}>Logout</button>
              </>
            ) : (
              <>
                <a href="/login" className="block py-1 hover:underline">Login</a>
                <a href="/register" className="block py-1 hover:underline">Register</a>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
} 