import React from "react";

export default function Topbar({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
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
      <div className="flex items-center gap-4">
        <select className="bg-[#22304a] text-white px-3 py-1 rounded-lg text-sm font-medium focus:outline-none">
          <option>Acme...</option>
        </select>
        <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg">S</div>
      </div>
    </header>
  );
}