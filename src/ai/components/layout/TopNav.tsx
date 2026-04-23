import { useEffect, useState } from "react";
import { Search, Bell, User, LogOut, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/api/apiClient";
import { getMyCredits } from "@/api/subscriptionApi";
import { AI_CREDITS_UPDATED_EVENT } from "@/api/aiApi";
const logo = "/rdc-logo.png";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Dashboard", path: "/ai-studio/dashboard" },
  { label: "Generate", path: "/ai-studio/generate" },
  { label: "My Designs", path: "/ai-studio/gallery" },
];

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const loadCredits = async () => {
      if (!getToken()) {
        setCredits(null);
        return;
      }

      try {
        const response = await getMyCredits();
        setCredits(response);
      } catch {
        setCredits(null);
      }
    };

    void loadCredits();
  }, [user]);

  useEffect(() => {
    const handleCreditsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setCredits(customEvent.detail);
      }
    };

    window.addEventListener(AI_CREDITS_UPDATED_EVENT, handleCreditsUpdate as EventListener);
    return () =>
      window.removeEventListener(AI_CREDITS_UPDATED_EVENT, handleCreditsUpdate as EventListener);
  }, []);

  return (
    <header className="h-16 border-b border-white/5 bg-[#0f0f0f]/60 backdrop-blur-xl flex items-center px-6 gap-8 shrink-0 sticky top-0 z-[100]">
      
      {/* 1. Logo with Hover Glow */}
      <Link to="/" className="group flex items-center gap-3 shrink-0">
        <div className="relative">
          <img
            src={logo}
            alt="AI Textile Studio"
            className="h-8 w-8 relative z-10 transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-[#ff1a1a] blur-xl opacity-20 group-hover:opacity-50 transition-opacity" />
        </div>
        <span className="font-display font-bold text-white text-lg tracking-tight hidden sm:inline">
          RDC <span className="text-gray-500 font-light">AI Studio</span>
        </span>
      </Link>

      

      {/* 2. Interactive Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`relative px-4 py-1.5 text-sm font-medium tracking-wide transition-all rounded-full ${
                isActive ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="relative z-10">{item.label}</span>

              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-white/5 border border-white/10 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. Search Bar with Intelligent Focus */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-[#ff1a1a] transition-colors" />
          <input
            type="text"
            placeholder="Search AI designs..."
            className="w-full h-9 pl-10 pr-4 rounded-full bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:bg-white/[0.07] focus:border-[#ff1a1a]/50 transition-all duration-300"
          />
        </div>
      </div>

      {/* 4. Action Icons */}
      <div className="flex items-center gap-2 ml-auto">
        <Link
          to="/"
          className="relative px-4 py-1.5 text-sm font-medium tracking-wide transition-all rounded-full text-gray-500 hover:text-white group hidden md:flex"
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="text-[#ff1a1a] text-base leading-none transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Back to Store
          </span>
        </Link>

        <button className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#ff1a1a] rounded-full border border-[#0f0f0f]" />
        </button>

        {credits !== null && (
          <Link
            to="/ai-studio/profile"
            className="hidden sm:flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-gray-300 hover:bg-white/[0.07] hover:text-white transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff1a1a]" />
            {credits} credits
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 w-9 rounded-full bg-gradient-to-br from-[#ff1a1a] to-[#990000] p-[1px] hover:shadow-[0_0_15px_rgba(255,26,26,0.4)] transition-shadow">
              <div className="flex items-center justify-center w-full h-full rounded-full bg-[#0f0f0f]">
                 <User className="h-4 w-4 text-white" />
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-xl p-2"
          >
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Account
            </DropdownMenuLabel>
            
            <div className="space-y-1">
              <DropdownMenuItem onClick={() => navigate("/ai-studio/profile")} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <User className="h-4 w-4 text-gray-400" /> <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/ai-studio/profile")} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <Settings className="h-4 w-4 text-gray-400" /> <span>Settings</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="my-2 bg-white/5" />

            <DropdownMenuItem onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#ff1a1a]/10 text-[#ff1a1a] cursor-pointer transition-colors">
              <LogOut className="h-4 w-4" /> <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
