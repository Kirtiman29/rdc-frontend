// src/ai/components/layout/AppSidebar.tsx
import React from "react";
import { 
  Wand2, Image, Heart, Settings, LayoutDashboard, 
  Maximize, Search, Sparkles, Palette, SwatchBook, User
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navSection = [
  { label: "Dashboard", path: "/ai-studio/dashboard", icon: LayoutDashboard },
  { label: "Generate Design", path: "/ai-studio/generate", icon: Wand2 },
  { label: "Upscale", path: "/ai-studio/upscale", icon: Maximize },
  { label: "Pattern Finder", path: "/ai-studio/finder", icon: Search },
  { label: "Recolor Studio", path: "/ai-studio/recolor", icon: Palette },
  { label: "Color Separation", path: "/ai-studio/color-separation", icon: SwatchBook },
];

const librarySection = [
  { label: "My Designs", path: "/ai-studio/gallery", icon: Image, count: 12 },
  { label: "Favorites", path: "/ai-studio/favorites", icon: Heart, count: 5 },
  { label: "Profile", path: "/ai-studio/profile", icon: User },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] shrink-0 flex flex-col py-6 sticky top-0 h-full">
      
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#ff1a1a]/5 to-transparent pointer-events-none" />

      <div className="flex-1 px-4 space-y-8 relative z-10 overflow-y-auto no-scrollbar">
        <SidebarGroup label="AI Tools">
          {navSection.map((item) => (
            <SidebarLink key={item.label} item={item} active={location.pathname === item.path} />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Your Space">
          {librarySection.map((item) => (
            <SidebarLink key={item.label} item={item} active={location.pathname === item.path} />
          ))}
        </SidebarGroup>
      </div>

      <div className="mt-auto px-4 pb-4 pt-4 border-t border-white/5 relative z-10">
        <SidebarLink
          item={{ label: "Settings", path: "/ai-studio/profile", icon: Settings }}
          active={location.pathname === "/ai-studio/profile"}
        />
        
        {/* Premium Upgrade Card */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 relative group cursor-pointer overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-semibold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[#ff1a1a]" /> Pro Plan
            </p>
            <p className="text-[10px] text-gray-500 mb-3">Unlock 4K Export & Batch Generation</p>
            <button className="w-full py-2 text-[10px] bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
              Upgrade Now
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#ff1a1a]/10 blur-2xl group-hover:bg-[#ff1a1a]/20 transition-colors" />
        </div>
      </div>
    </aside>
  );
}

function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] px-3 mb-3">
        {label}
      </p>
      <nav className="flex flex-col gap-1">{children}</nav>
    </div>
  );
}

function SidebarLink({
  item,
  active,
}: {
  item: { label: string; path: string; icon: React.ElementType; count?: number };
  active: boolean;
}) {
  return (
    <Link
      to={item.path}
      className="relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all outline-none"
    >
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-0 bg-[#ff1a1a]/10 border border-[#ff1a1a]/20 rounded-xl z-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <item.icon className={`h-4 w-4 relative z-10 transition-colors duration-300 ${active ? "text-[#ff1a1a]" : "text-gray-500 group-hover:text-white"}`} />
      
      <span className={`flex-1 relative z-10 transition-colors duration-300 ${active ? "text-white font-semibold" : "text-gray-400 group-hover:text-white"}`}>
        {item.label}
      </span>

      {item.count !== undefined && !active && (
        <span className="text-[10px] text-gray-600 font-mono relative z-10">
          {item.count}
        </span>
      )}

      {active && (
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-1 h-1 rounded-full bg-[#ff1a1a] shadow-[0_0_8px_#ff1a1a] relative z-10" 
        />
      )}
    </Link>
  );
}
