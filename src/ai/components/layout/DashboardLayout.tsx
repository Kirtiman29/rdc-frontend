// src/ai/components/layout/DashboardLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";
import AIStudioLoader from "@/components/layout/AIStudioLoader";

export default function DashboardLayout() {
  const [showLoader, setShowLoader] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#111315] text-white">
      {showLoader && <AIStudioLoader onFinish={() => setShowLoader(false)} />}

      <div className="shrink-0 z-30">
        <TopNav />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-[#111315] relative custom-scrollbar">
          <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
            <Outlet /> 
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
