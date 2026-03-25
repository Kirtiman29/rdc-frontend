// src/ai/components/layout/DashboardLayout.tsx
import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { AppSidebar } from "./AppSidebar";

export default function DashboardLayout() {
  return (
    // 1. Force the container to be exactly the height of the screen
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden">
      
      {/* TOP NAV: Fixed height, no shrinking */}
      <div className="shrink-0 z-30">
        <TopNav />
      </div>

      {/* BODY AREA: Takes up remaining height */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR: Stays fixed because its parent (this div) is overflow-hidden */}
        <div className="shrink-0 h-full border-r border-white/5">
          <AppSidebar />
        </div>

        {/* MAIN CONTENT: The only part that scrolls */}
        <main className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
          {/* Outlet renders your Index or Generate pages */}
          <Outlet /> 
        </main>

      </div>
    </div>
  );
}