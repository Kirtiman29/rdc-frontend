// src/ai/components/layout/Footer.tsx
import { Link } from "react-router-dom";
import { Sparkles, Heart, HelpCircle, FileText, Globe } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#2B3138]/40 bg-[#141618] text-[#A1A8B3] text-sm relative z-20 mt-16">
      {/* Decorative top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E11D2E]/30 to-transparent" />

      <div className="mx-auto max-w-[1480px] px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Left Section: Logo & About */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <img src="/rdc-logo.png" alt="RDC Logo" className="h-7 w-7" />
            <span className="font-display font-bold text-white text-md">
              RDC <span className="text-[#A1A8B3] font-light">AI Studio</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-[#6B7280]">
            An advanced AI-powered design studio for modern digital art and textile creations. Generate patterns, upscale visuals, and extract colorways seamlessly.
          </p>
        </div>

        {/* Column 1: AI Generation */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E11D2E]" /> Generate
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/ai-studio/generate" className="hover:text-white transition-colors">Pattern Generate</Link>
            </li>
            <li>
              <Link to="/ai-studio/gemini-text-to-image" className="hover:text-white transition-colors">Text to Pattern</Link>
            </li>
            <li>
              <Link to="/ai-studio/gemini-image-mix" className="hover:text-white transition-colors">Pattern Mixer</Link>
            </li>
            <li>
              <Link to="/ai-studio/color-separation" className="hover:text-white transition-colors">Color Separation</Link>
            </li>
            <li>
              <Link to="/ai-studio/bitmap" className="hover:text-white transition-colors">Bitmap</Link>
            </li>
            <li>
              <Link to="/ai-studio/generate?mode=placement" className="hover:text-white transition-colors">Placement Pattern</Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Pattern Edit & Color */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Pattern Edit & Color
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/ai-studio/generate?mode=seamless" className="hover:text-white transition-colors">Seamless</Link>
            </li>
            <li>
              <Link to="/ai-studio/upscale" className="hover:text-white transition-colors">Upscale</Link>
            </li>
            <li>
              <Link to="/ai-studio/finder" className="hover:text-white transition-colors">Pattern Extractor</Link>
            </li>
            <li>
              <Link to="/ai-studio/recolor" className="hover:text-white transition-colors">Color Matching</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Pattern Effect & Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Pattern Effect & Settings
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/ai-studio/painting-technique" className="hover:text-white transition-colors">Brush Effect</Link>
            </li>
            <li>
              <Link to="/ai-studio/generate?mode=texture" className="hover:text-white transition-colors">Texture</Link>
            </li>
            <li>
              <Link to="/ai-studio/generate?mode=fabric-texture" className="hover:text-white transition-colors">Fabric Texture</Link>
            </li>
            <li>
              <Link to="/ai-studio/generate?mode=embroidery" className="hover:text-white transition-colors">Embroidery</Link>
            </li>
            <li>
              <Link to="/ai-studio/gallery" className="hover:text-white transition-colors">My Designs</Link>
            </li>
            <li>
              <Link to="/ai-studio/favorites" className="hover:text-white transition-colors">Favorites</Link>
            </li>
            <li>
              <Link to="/ai-studio/profile" className="hover:text-white transition-colors">Profile Settings</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#2B3138]/20 bg-[#0E1012] py-6 text-xs text-[#6B7280]">
        <div className="mx-auto max-w-[1480px] px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} RDC AI Studio. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/terms" className="hover:text-white transition-colors flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Terms of Use
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Support
            </Link>
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Store Home
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Minimal inline mock helper if Shield icon is missing
function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8.24-2.28a1 1 0 0 1 .5 0l8.24 2.28A1 1 0 0 1 20 6z" />
    </svg>
  );
}
