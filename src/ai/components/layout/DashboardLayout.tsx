// src/ai/components/layout/DashboardLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { AppSidebar } from "./AppSidebar";
import AIStudioLoader from "@/components/layout/AIStudioLoader";

export default function DashboardLayout() {
  const [showLoader, setShowLoader] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#050505] text-white">
      {showLoader && <AIStudioLoader onFinish={() => setShowLoader(false)} />}

      <div className="shrink-0 z-30">
        <TopNav />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="shrink-0 h-full border-r border-white/5">
          <AppSidebar />
        </div>

        <main className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}
