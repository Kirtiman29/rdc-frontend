import React, { useState, useEffect } from "react";
import { 
  Image, Sparkles, Wand2, Loader2, LayoutGrid, 
  Info, Maximize2, Zap, Palette 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


// --- SUB-COMPONENT: GENERATOR PANEL ---
function GeneratorPanel({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  const [strength, setStrength] = useState(0.75);
  const [activeStyle, setActiveStyle] = useState("floral");

  const styles = [
    { id: "floral", label: "Floral" },
    { id: "paisley", label: "Paisley" },
    { id: "abstract", label: "Abstract" }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* 1. MODEL SECTION (Hardcoded as requested) */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">AI Engine</label>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-[#ff1a1a]/20 flex items-center justify-center border border-[#ff1a1a]/30 shadow-[0_0_15px_rgba(255,26,26,0.1)]">
            <Zap className="w-5 h-5 text-[#ff1a1a]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">Textile SDXL Pro</p>
            <p className="text-[10px] text-gray-500 font-medium">v1.0 • Pattern Specialized</p>
          </div>
        </div>
      </div>

      {/* --- IMAGE DROP BOX SECTION --- */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
      Reference Image
    </label>
    <span className="text-[9px] text-gray-600 font-medium">OPTIONAL</span>
  </div>
  
  <motion.div
    whileHover={{ borderColor: "rgba(255, 26, 26, 0.4)", backgroundColor: "rgba(255, 26, 26, 0.02)" }}
    className="relative group cursor-pointer border-2 border-dashed border-white/5 rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden"
  >
    {/* Animated Background Pulse */}
    <div className="absolute inset-0 bg-[#ff1a1a]/0 group-hover:bg-[#ff1a1a]/5 transition-colors duration-500" />
    
    <div className="relative z-10 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:border-[#ff1a1a]/30 transition-all duration-500">
      <Image className="w-5 h-5 text-gray-500 group-hover:text-[#ff1a1a]" />
    </div>
    
    <div className="relative z-10 text-center">
      <p className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
        Drop reference here
      </p>
      <p className="text-[10px] text-gray-600 mt-1">PNG, JPG up to 10MB</p>
    </div>

    {/* Hidden Input for Functionality */}
    <input 
      type="file" 
      className="absolute inset-0 opacity-0 cursor-pointer" 
      accept="image/*"
      onChange={(e) => console.log("Image uploaded:", e.target.files?.[0])}
    />
  </motion.div>
</div>

      {/* 2. STYLE SECTION (3 Options Only) */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Pattern Style</label>
        <div className="grid grid-cols-3 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setActiveStyle(style.id)}
              className={`py-2.5 text-xs rounded-xl border transition-all duration-300 font-medium ${
                activeStyle === style.id 
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                : "bg-transparent border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. PROMPT SECTION (With Enhance Hover Effect) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Prompt</label>
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "#ff1a1a", color: "#fff" }}
              whileTap={{ scale: 0.95 }}
              className="text-[10px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff1a1a]/10 text-[#ff1a1a] border border-[#ff1a1a]/20 transition-all"
            >
              <Wand2 className="w-3 h-3" />
              Enhance
            </motion.button>
        </div>
        <textarea 
          placeholder="Describe the fabric texture, colors, and pattern details..."
          className="w-full h-32 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#ff1a1a]/40 focus:bg-white/[0.04] transition-all resize-none"
        />
      </div>

{/* 4. STRENGTH SLIDER (0-1) */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
      Creative Strength
    </label>
    <span className="text-xs font-mono font-bold text-[#ff1a1a] bg-[#ff1a1a]/10 px-2 py-0.5 rounded border border-[#ff1a1a]/20">
      {strength.toFixed(2)}
    </span>
  </div>

  <div className="relative flex items-center group">
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={strength}
      onChange={(e) => setStrength(parseFloat(e.target.value))}
      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white transition-all"
      style={{
        // This creates the "Fill" effect dynamically
        background: `linear-gradient(to right, #ff1a1a 0%, #ff1a1a ${strength * 100}%, rgba(255,255,255,0.1) ${strength * 100}%, rgba(255,255,255,0.1) 100%)`,
      }}
    />
    
    {/* CSS for the Thumb (The circle) to make it look pro */}
    <style dangerouslySetInnerHTML={{ __html: `
      input[type=range]::-webkit-slider-thumb {
        appearance: none;
        height: 14px;
        width: 14px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        border: 2px solid #ff1a1a;
        box-shadow: 0 0 10px rgba(255, 26, 26, 0.5);
        transition: all 0.2s ease;
      }
      input[type=range]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 15px rgba(255, 26, 26, 0.8);
      }
    `}} />
  </div>
</div>

      {/* 5. DISABLED SETTINGS (Ratio & Quality)
      <div className="pt-2 space-y-4 opacity-30 cursor-not-allowed select-none">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <span>Aspect Ratio</span>
            <span className="text-[9px] bg-white/5 px-2 rounded">Locked</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <span>Output Quality</span>
            <span className="text-[9px] bg-white/5 px-2 rounded">Locked</span>
          </div>
      </div> */}

      {/* 6. GENERATE BUTTON */}
      <button 
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full group relative overflow-hidden py-4 rounded-2xl bg-[#ff1a1a] text-white font-bold tracking-wider transition-all hover:shadow-[0_8px_30px_rgba(255,26,26,0.3)] disabled:opacity-40 disabled:hover:shadow-none"
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isGenerating ? "PROCESSING..." : "GENERATE DESIGN"}
        </div>
      </button>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function Generate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    // Simulation logic
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsGenerating(false), 1000);
          return 100;
        }
        return prev + 1;
      });
    }, 40);
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* LEFT COLUMN: CONTROLS */}
      <div className="w-full lg:w-96 xl:w-[420px] shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tighter">CREATE</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">Studio Workspace</p>
          </div>
          <Palette className="w-5 h-5 text-gray-700" />
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <GeneratorPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
        </div>
      </div>

      {/* RIGHT COLUMN: CANVAS / OUTPUT */}
      <div className="flex-1 relative flex flex-col bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,26,26,0.03)_0%,_transparent_100%)] pointer-events-none" />
        
        <div className="flex-1 flex items-center justify-center p-12">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              /* PROFESSIONAL BUFFERING STATE */
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                className="relative flex flex-col items-center"
              >
                {/* Visual Ring */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full rotate-[-90deg]">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                    <motion.circle 
                      cx="96" cy="96" r="88" stroke="#ff1a1a" strokeWidth="3" fill="transparent"
                      strokeDasharray="552.92"
                      animate={{ strokeDashoffset: 552.92 - (552.92 * progress) / 100 }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-black font-mono tracking-tighter">{progress}%</span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-[0.4em] uppercase mt-2">Neural Link</span>
                  </div>
                </div>
                
                {/* Status Subtitle */}
                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-12 text-center space-y-1"
                >
                  <p className="text-sm font-bold tracking-widest text-white uppercase">Synthesizing Pixels</p>
                  <p className="text-[10px] text-gray-600 font-medium">Textile SDXL is weaving your pattern...</p>
                </motion.div>
              </motion.div>
            ) : (
              /* EMPTY STATE */
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center justify-center group hover:border-[#ff1a1a]/30 transition-all duration-700">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                    <LayoutGrid className="w-10 h-10 text-gray-700 group-hover:text-[#ff1a1a] transition-colors" />
                  </motion.div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">System Idle</h2>
                  <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed">
                    Ready to transform your prompts into high-fidelity textile designs.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}