// src/ai/components/layout/AppSidebar.tsx
import React from "react";
import { 
  Wand2, Image, Heart, Settings, LayoutDashboard, 
  Maximize, Search, Sparkles, Palette, SwatchBook, User, ImageUp
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navSection = [
  { label: "Dashboard", path: "/ai-studio/dashboard", icon: LayoutDashboard },
  { label: "Pattern Generator", path: "/ai-studio/generate", icon: Wand2 },
  { label: "Bitmap", path: "/ai-studio/bitmap", icon: ImageUp },
  { label: "Text to Pattern", path: "/ai-studio/gemini-text-to-image", icon: Sparkles },
  { label: "Pattern Mixer", path: "/ai-studio/gemini-image-mix", icon: Image },
  { label: "Upscale", path: "/ai-studio/upscale", icon: Maximize },
  { label: "Pattern Extractor", path: "/ai-studio/finder", icon: Search },
  { label: "Color Matching", path: "/ai-studio/recolor", icon: Palette },
  { label: "AI Color Matching", path: "/ai-studio/ai-color-matching", icon: Sparkles },
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
    <aside className="w-64 border-r border-[#2B3138] bg-[#181B1F] shrink-0 flex flex-col py-6 sticky top-0 h-full">
      
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#E11D2E]/10 to-transparent pointer-events-none" />

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

      <div className="mt-auto px-4 pb-4 pt-4 border-t border-[#2B3138] relative z-10">
        <SidebarLink
          item={{ label: "Settings", path: "/ai-studio/profile", icon: Settings }}
          active={location.pathname === "/ai-studio/profile"}
        />
        
        {/* Premium Upgrade Card */}
        <div className="mt-6 p-4 rounded-2xl bg-[#1C2025] border border-[#2B3138] relative group cursor-pointer overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-semibold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[#E11D2E]" /> Pro Plan
            </p>
            <p className="text-[10px] text-[#A1A8B3] mb-3">Unlock 4K Export & Batch Generation</p>
            <button className="w-full py-2 text-[10px] bg-[#E11D2E] text-white font-bold rounded-lg hover:bg-[#FF3347] transition-colors">
              Upgrade Now
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#E11D2E]/10 blur-2xl group-hover:bg-[#E11D2E]/20 transition-colors" />
        </div>
      </div>
    </aside>
  );
}

function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold text-[#6B7280] uppercase px-3 mb-3">
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
      className="relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all outline-none hover:bg-white/[0.04]"
    >
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-0 bg-[rgba(225,29,46,0.1)] border border-[#E11D2E]/20 rounded-xl z-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border transition-colors duration-300 ${
        active
          ? "border-[#E11D2E]/25 bg-[rgba(225,29,46,0.1)] text-[#E11D2E]"
          : "border-[#2B3138] bg-[#20242A] text-[#A1A8B3] group-hover:text-white"
      }`}>
        <item.icon className="h-4 w-4" />
      </span>
      
      <span className={`flex-1 relative z-10 transition-colors duration-300 ${active ? "text-white font-semibold" : "text-[#A1A8B3] group-hover:text-white"}`}>
        {item.label}
      </span>

      {item.count !== undefined && !active && (
        <span className="text-[10px] text-[#6B7280] font-mono relative z-10">
          {item.count}
        </span>
      )}

      {active && (
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#E11D2E] z-10" 
        />
      )}
    </Link>
  );
}
