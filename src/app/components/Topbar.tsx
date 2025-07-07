import React from "react";

export default function Topbar() {
  return (
    <header className="flex items-center justify-between bg-[#192132] px-8 py-4 shadow-sm rounded-b-xl">
      <div />
      <div className="flex items-center gap-4">
        <select className="bg-[#22304a] text-white px-3 py-1 rounded-lg text-sm font-medium focus:outline-none">
          <option>Acme...</option>
        </select>
        <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg">S</div>
      </div>
    </header>
  );
} 