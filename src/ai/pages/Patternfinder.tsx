// path: src/ai/pages/Patternfinder.tsx
import { motion } from "framer-motion";
import { Search, Move, Fingerprint, Layers, Scan } from "lucide-react";

export default function PatternFinder() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff1a1a]/5 blur-[140px] rounded-full pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center text-center max-w-3xl"
      >
        {/* NEURAL TARGETING ANIMATION */}
        <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
          {/* Rotating Outer Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border border-dashed border-white/10 rounded-full"
          />
          
          {/* Pulsing Target Corners */}
          <div className="absolute inset-4 border-t-2 border-l-2 border-[#ff1a1a] w-6 h-6 rounded-tl-lg" />
          <div className="absolute inset-4 bottom-4 right-4 left-auto top-auto border-b-2 border-r-2 border-[#ff1a1a] w-6 h-6 rounded-br-lg" />
          
          <div className="relative w-20 h-20 bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
            <Scan className="w-10 h-10 text-[#ff1a1a]" />
            
            {/* The Extraction Wave */}
            <motion.div 
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-[#ff1a1a]/20 rounded-2xl"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-gray-500 text-[10px] font-black tracking-[0.3em] uppercase mb-6">
          <Fingerprint className="w-3.5 h-3.5 text-[#ff1a1a]" />
          Pattern Recognition v0.1
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
          PATTERN <span className="text-[#ff1a1a]">EXTRACTOR</span>
        </h1>
        
        <p className="text-gray-400 text-sm md:text-base max-w-lg leading-relaxed mb-12">
          Upload a photo of any garment or fabric. Our AI will deconstruct the weave, isolate the motif, and convert it into a seamless digital vector.
        </p>

        {/* Coming Soon Status */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ff1a1a] to-transparent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative px-10 py-5 rounded-2xl bg-[#0a0a0a] border border-white/10 backdrop-blur-xl">
             <span className="text-2xl font-black font-mono tracking-[0.2em] text-white">UNDER DEVELOPMENT</span>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="flex items-center gap-12 mt-20 opacity-40">
            <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-xl bg-white/5"><Move className="w-5 h-5" /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest">1. Capture</span>
            </div>
            <div className="h-[1px] w-12 bg-white/10" />
            <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-xl bg-white/5"><Layers className="w-5 h-5" /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest">2. Isolate</span>
            </div>
            <div className="h-[1px] w-12 bg-white/10" />
            <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-xl bg-white/5"><Search className="w-5 h-5" /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest">3. Vectorize</span>
            </div>
        </div>
      </motion.div>
    </div>
  );
}