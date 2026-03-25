// path: src/ai/pages/Upscale.tsx
import { motion } from "framer-motion";
import { Maximize, Sparkles, Zap, ShieldCheck } from "lucide-react";

export default function Upscale() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff1a1a]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center text-center max-w-2xl"
      >
        {/* Animated Icon Scanner */}
        <div className="relative w-32 h-32 mb-8 group">
          <div className="absolute inset-0 bg-[#ff1a1a]/20 rounded-3xl blur-xl group-hover:bg-[#ff1a1a]/40 transition-all duration-700" />
          <div className="relative h-full w-full bg-[#0a0a0a] border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden">
            <Maximize className="w-12 h-12 text-[#ff1a1a]" />
            
            {/* The Scanning Beam */}
            <motion.div 
              animate={{ top: ["-10%", "110%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff1a1a] to-transparent shadow-[0_0_15px_#ff1a1a] z-20"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/20 text-[#ff1a1a] text-[10px] font-black tracking-[0.3em] uppercase mb-4">
          <Zap className="w-3 h-3 fill-current" />
          Experimental Feature
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
          ULTRA-HD <span className="text-gray-600 tracking-normal font-light">UPSCALING</span>
        </h1>
        
        <p className="text-gray-500 text-sm md:text-base max-w-md leading-relaxed mb-10">
          We are fine-tuning our neural super-resolution models to bring 4K textile textures to your fingertips. Zero loss in detail, maximum clarity.
        </p>

        {/* Coming Soon Badge */}
        <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
           <span className="text-2xl font-mono font-bold tracking-widest text-white">COMING SOON</span>
        </div>

        {/* Feature Teaser Grid */}
        <div className="grid grid-cols-3 gap-8 mt-16 w-full">
            <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gray-700" />
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Texture Preservation</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Sparkles className="w-5 h-5 text-gray-700" />
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">AI Denoising</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Maximize className="w-5 h-5 text-gray-700" />
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">8K Export</span>
            </div>
        </div>
      </motion.div>
    </div>
  );
}