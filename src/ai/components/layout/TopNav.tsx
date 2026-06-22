import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Search, Settings, User, Zap, ChevronDown } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/api/apiClient";
import { getMyCredits } from "@/api/subscriptionApi";
import { AI_CREDITS_UPDATED_EVENT } from "@/api/aiApi";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const logo = "/rdc-logo.png";

const generateItems = [
  { label: "Pattern Generate", path: "/ai-studio/generate" },
  { label: "Text to Pattern", path: "/ai-studio/gemini-text-to-image" },
  { label: "Pattern Mixer", path: "/ai-studio/gemini-image-mix" },
  { label: "Color Separation", path: "/ai-studio/color-separation" },
  { label: "Bitmap", path: "/ai-studio/generate?mode=bitmap" },
  { label: "Placement Pattern", path: "/ai-studio/generate?mode=placement" },
];

const editItems = [
  { label: "Seamless", path: "/ai-studio/generate?mode=seamless" },
  { label: "Upscale", path: "/ai-studio/upscale" },
  { label: "Pattern Extractor", path: "/ai-studio/finder" },
];

const colorItems = [
  { label: "Color Matching", path: "/ai-studio/recolor" },
];

const toolsItems = [
  { label: "Brush Effect", path: "/ai-studio/generate?mode=brush" },
  { label: "Texture", path: "/ai-studio/generate?mode=texture" },
  { label: "Fabric Texture", path: "/ai-studio/generate?mode=fabric-texture" },
  { label: "Embroidery", path: "/ai-studio/generate?mode=embroidery" },
];

interface DropdownNavItemProps {
  label: string;
  items: { label: string; path: string }[];
  isActive: boolean;
  activeDropdown: string | null;
  setActiveDropdown: (val: string | null) => void;
  dropdownId: string;
  currentPath: string;
}

function DropdownNavItem({
  label,
  items,
  isActive,
  activeDropdown,
  setActiveDropdown,
  dropdownId,
  currentPath,
}: DropdownNavItemProps) {
  const isOpen = activeDropdown === dropdownId;

  return (
    <div
      className="relative py-2"
      onMouseEnter={() => setActiveDropdown(dropdownId)}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <button
        className={`flex items-center gap-1 px-4 py-1.5 text-sm font-medium transition-all rounded-full relative z-10 ${
          isActive || isOpen ? "text-white" : "text-[#A1A8B3] hover:text-white"
        }`}
      >
        <span className="relative z-20">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#A1A8B3] transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : ""}`} />
        {isActive && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 bg-[rgba(225,29,46,0.08)] border border-[#E11D2E]/20 rounded-full"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-60 rounded-xl border border-[#2B3138] bg-[#181B1F]/95 backdrop-blur-xl p-2 shadow-2xl z-50 flex flex-col gap-0.5"
          >
            {items.map((subItem) => {
              const isSubActive = currentPath === subItem.path;
              return (
                <Link
                  key={subItem.label}
                  to={subItem.path}
                  onClick={() => setActiveDropdown(null)}
                  className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isSubActive
                      ? "bg-[#E11D2E]/10 text-[#FF4D5D]"
                      : "text-[#A1A8B3] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {subItem.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [creditDelta, setCreditDelta] = useState<number | null>(null);
  const creditsRef = useRef<number | null>(null);
  const deltaTimeoutRef = useRef<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
    creditsRef.current = credits;
  }, [credits]);

  useEffect(() => {
    const handleCreditsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        if (
          typeof creditsRef.current === "number" &&
          customEvent.detail < creditsRef.current
        ) {
          setCreditDelta(creditsRef.current - customEvent.detail);

          if (deltaTimeoutRef.current) {
            window.clearTimeout(deltaTimeoutRef.current);
          }

          deltaTimeoutRef.current = window.setTimeout(() => {
            setCreditDelta(null);
            deltaTimeoutRef.current = null;
          }, 2200);
        }

        setCredits(customEvent.detail);
      }
    };

    window.addEventListener(AI_CREDITS_UPDATED_EVENT, handleCreditsUpdate as EventListener);
    return () => {
      if (deltaTimeoutRef.current) {
        window.clearTimeout(deltaTimeoutRef.current);
      }

      window.removeEventListener(AI_CREDITS_UPDATED_EVENT, handleCreditsUpdate as EventListener);
    };
  }, []);

  const balanceTone =
    credits !== null && credits < 20
      ? "border-[#E11D2E]/35 bg-[rgba(225,29,46,0.1)] text-[#ffb3b3] hover:border-[#E11D2E]/50"
      : credits !== null && credits < 50
        ? "border-[#F59E0B]/35 bg-[rgba(245,158,11,0.1)] text-[#ffd4ba] hover:border-[#F59E0B]/50"
        : "border-[#2B3138] bg-[#1C2025] text-[#A1A8B3] hover:border-[#E11D2E]/25";

  const balanceIconTone =
    credits !== null && credits < 20
      ? "border-[#E11D2E]/25 bg-[rgba(225,29,46,0.1)] text-[#ff6b6b]"
      : credits !== null && credits < 50
        ? "border-[#F59E0B]/25 bg-[rgba(245,158,11,0.1)] text-[#F59E0B]"
        : "border-[#E11D2E]/20 bg-[rgba(225,29,46,0.1)] text-[#E11D2E]";

  return (
    <header className="h-16 border-b border-[#2B3138] bg-[#181B1F]/90 backdrop-blur-xl flex items-center px-6 gap-8 shrink-0 sticky top-0 z-[100]">
      <Link to="/" className="group flex items-center gap-3 shrink-0">
        <div className="relative">
          <img
            src={logo}
            alt="AI Textile Studio"
            className="h-8 w-8 relative z-10 transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-[#E11D2E] blur-xl opacity-20 group-hover:opacity-50 transition-opacity" />
        </div>
        <span className="font-display font-bold text-white text-lg hidden sm:inline">
          RDC <span className="text-[#A1A8B3] font-light">AI Studio</span>
        </span>
      </Link>

      <div className="flex-1 flex justify-center">
        <nav className="flex items-center gap-1">
          <Link
            to="/ai-studio/dashboard"
            className={`relative px-4 py-1.5 text-sm font-medium transition-all rounded-full ${
              location.pathname === "/ai-studio/dashboard" ? "text-white" : "text-[#A1A8B3] hover:text-white"
            }`}
          >
            <span className="relative z-10">Dashboard</span>
            {location.pathname === "/ai-studio/dashboard" && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 bg-[rgba(225,29,46,0.08)] border border-[#E11D2E]/20 rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>

          <DropdownNavItem
            label="Generate"
            items={generateItems}
            isActive={
              [
                "/ai-studio/gemini-text-to-image",
                "/ai-studio/gemini-image-mix",
                "/ai-studio/color-separation",
              ].includes(location.pathname) || 
              (location.pathname === "/ai-studio/generate" && 
                !["?mode=seamless", "?mode=brush", "?mode=texture", "?mode=fabric-texture", "?mode=embroidery"].includes(location.search))
            }
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            dropdownId="generate"
            currentPath={location.pathname + location.search}
          />

          <DropdownNavItem
            label="Pattern Edit"
            items={editItems}
            isActive={
              [
                "/ai-studio/upscale",
                "/ai-studio/finder",
              ].includes(location.pathname) ||
              (location.pathname === "/ai-studio/generate" && location.search === "?mode=seamless")
            }
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            dropdownId="edit"
            currentPath={location.pathname + location.search}
          />

          <DropdownNavItem
            label="Color"
            items={colorItems}
            isActive={[
              "/ai-studio/recolor",
            ].includes(location.pathname)}
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            dropdownId="color"
            currentPath={location.pathname + location.search}
          />

          <DropdownNavItem
            label="Pattern Effect"
            items={toolsItems}
            isActive={
              [
                "?mode=brush",
                "?mode=texture",
                "?mode=fabric-texture",
                "?mode=embroidery",
              ].includes(location.search) && location.pathname === "/ai-studio/generate"
            }
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            dropdownId="pattern-effect"
            currentPath={location.pathname + location.search}
          />

          <Link
            to="/ai-studio/gallery"
            className={`relative px-4 py-1.5 text-sm font-medium transition-all rounded-full ${
              location.pathname === "/ai-studio/gallery" ? "text-white" : "text-[#A1A8B3] hover:text-white"
            }`}
          >
            <span className="relative z-10">My Designs</span>
            {location.pathname === "/ai-studio/gallery" && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 bg-[rgba(225,29,46,0.08)] border border-[#E11D2E]/20 rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <div className="relative group hidden lg:block w-40 xl:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280] group-focus-within:text-[#E11D2E] transition-colors" />
          <input
            type="text"
            placeholder="Search AI designs..."
            className="w-full h-9 pl-9 pr-3 rounded-full bg-[#1C2025] border border-[#2B3138] text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:bg-[#20242A] focus:border-[#E11D2E]/50 transition-all duration-300"
          />
        </div>

        <Link
          to="/"
          className="relative px-3.5 py-1.5 text-xs font-semibold transition-all rounded-full text-[#A1A8B3] border border-[#2B3138] hover:border-[#E11D2E]/40 hover:bg-[#20242A] hover:text-white group hidden md:flex items-center gap-1.5"
        >
          <span className="text-[#E11D2E] text-sm leading-none transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          Back to Store
        </Link>

        <button className="relative p-2 rounded-full text-[#A1A8B3] hover:text-white hover:bg-white/[0.04] transition-all border border-[#2B3138]">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#E11D2E] rounded-full border border-[#181B1F]" />
        </button>

        {credits !== null && (
          <div className="relative hidden sm:block">
            <AnimatePresence>
              {creditDelta !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: -10, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.96 }}
                  className="pointer-events-none absolute -top-8 right-0 rounded-full border border-[#E11D2E]/20 bg-[#1C2025]/95 px-2.5 py-1 text-[10px] font-bold uppercase text-[#ff6b6b]"
                >
                  -{creditDelta} Credits
                </motion.div>
              )}
            </AnimatePresence>

            <Link
              to="/ai-studio/profile"
              title={`${credits} credits available`}
              className={`flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-all hover:text-white ${balanceTone}`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${balanceIconTone}`}>
                <Zap className="h-3 w-3" strokeWidth={2.3} />
              </span>
              <span className="text-white">{credits}</span>
            </Link>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 w-9 rounded-full bg-gradient-to-br from-[#E11D2E] to-[#8f101c] p-[1px] hover:shadow-[0_0_15px_rgba(225,29,46,0.35)] transition-shadow">
              <div className="flex items-center justify-center w-full h-full rounded-full bg-[#181B1F]">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 bg-[#181B1F]/95 backdrop-blur-xl border border-[#2B3138] text-white shadow-2xl rounded-xl p-2"
          >
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-[#6B7280] uppercase">
              Account
            </DropdownMenuLabel>

            <div className="space-y-1">
              <DropdownMenuItem onClick={() => navigate("/ai-studio/profile")} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors">
                <User className="h-4 w-4 text-[#A1A8B3]" /> <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/ai-studio/profile")} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors">
                <Settings className="h-4 w-4 text-[#A1A8B3]" /> <span>Settings</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="my-2 bg-[#2B3138]" />

            <DropdownMenuItem onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgba(225,29,46,0.1)] text-[#E11D2E] cursor-pointer transition-colors">
              <LogOut className="h-4 w-4" /> <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
