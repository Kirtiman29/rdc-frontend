// path: src/ai/pages/Upscale.tsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Maximize, Sparkles, Zap, ShieldCheck, 
  Upload, Image as ImageIcon, CheckCircle2, 
  ChevronRight, RefreshCcw, Layers 
} from "lucide-react";

export default function Upscale() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [scaleFactor, setScaleFactor] = useState("4x");
  const [upscaleType, setUpscaleType] = useState("textile");

  // Comparison Slider Logic
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleGenerate = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => setIsProcessing(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans selection:bg-[#ff1a1a]/30">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[#ff1a1a]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/20 text-[#ff1a1a] text-[10px] font-black tracking-[0.2em] uppercase mb-4">
              <Zap className="w-3 h-3 fill-current" /> Neural Engine v1.0
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              Ultra-HD <span className="text-gray-600 font-light">Upscaler</span>
            </h1>
          </div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
            Textile Fidelity: <span className="text-white">Enhanced</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* LEFT: INTERACTIVE COMPARISON / UPLOAD AREA */}
          <div className="lg:col-span-7">
            {!preview ? (
              <label className="group relative flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed border-white/10 rounded-[32px] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#ff1a1a]/50 transition-all cursor-pointer overflow-hidden">
                <div className="flex flex-col items-center gap-4 text-center p-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#ff1a1a]/10 transition-all">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#ff1a1a]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight">Drop textile design or click to browse</p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-bold">Supports RAW, TIFF, PNG (Max 50MB)</p>
                  </div>
                </div>
                <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
              </label>
            ) : (
              <div 
                className="relative w-full aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 cursor-col-resize group"
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
              >
                {/* After Image (Upscaled) */}
                <div className="absolute inset-0 bg-[#0a0a0a]">
                  <img src={preview} className="w-full h-full object-cover grayscale-0" alt="After" />
                  <div className="absolute top-6 right-6 px-3 py-1 bg-[#ff1a1a] text-white text-[10px] font-black uppercase rounded-md shadow-xl">Enhanced (8K)</div>
                </div>

                {/* Before Image (Original) */}
                <div 
                  className="absolute inset-0 border-r-2 border-[#ff1a1a] shadow-[10px_0_30px_rgba(255,26,26,0.3)] overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img src={preview} className="w-[142.8%] max-w-none h-full object-cover blur-[2px] opacity-70 grayscale" alt="Before" 
                    style={{ width: `${100 * (100 / sliderPosition)}%` }}
                  />
                  <div className="absolute top-6 left-6 px-3 py-1 bg-black/80 text-white text-[10px] font-black uppercase rounded-md border border-white/20">Original (Low-Res)</div>
                </div>

                {/* Slider Handle */}
                <div 
                  className="absolute inset-y-0 pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,26,26,0.5)] border-2 border-[#ff1a1a]">
                    <RefreshCcw className="w-5 h-5 text-black animate-spin-slow" />
                  </div>
                </div>

                {/* Processing Overlay */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                    >
                      <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 bg-[#ff1a1a]/20 rounded-2xl blur-xl animate-pulse" />
                        <div className="relative h-full w-full bg-[#0a0a0a] border border-[#ff1a1a]/30 rounded-2xl flex items-center justify-center overflow-hidden">
                          <Maximize className="w-10 h-10 text-[#ff1a1a]" />
                          <motion.div 
                            animate={{ top: ["-10%", "110%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-[#ff1a1a] shadow-[0_0_15px_#ff1a1a] z-20"
                          />
                        </div>
                      </div>
                      <p className="text-[#ff1a1a] font-mono text-sm font-bold tracking-[0.3em] animate-pulse">RECONSTRUCTING PIXELS...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* RIGHT: CONTROLS PANEL */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Scale Options */}
            <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/10">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">Upscale Ratio</label>
              <div className="grid grid-cols-3 gap-3">
                {["4x", "8x", "16x"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setScaleFactor(val)}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                      scaleFactor === val 
                      ? "bg-[#ff1a1a] border-[#ff1a1a] text-white shadow-[0_0_20px_rgba(255,26,26,0.3)]" 
                      : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Type */}
            <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/10">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">Optimization Model</label>
              <div className="flex flex-col gap-3">
                {[
                  { id: 'normal', label: 'Standard Upscale', desc: 'General purpose enhancement' },
                  { id: 'textile', label: 'Textile Fiber AI', desc: 'Preserves thread detail & weave texture' },
                  { id: 'double', label: 'Double Scale Ultra', desc: 'Maximum smoothness for prints' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setUpscaleType(type.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      upscaleType === type.id 
                      ? "bg-white/10 border-[#ff1a1a]/50" 
                      : "bg-white/5 border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${upscaleType === type.id ? "bg-[#ff1a1a] text-white" : "bg-white/10"}`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase">{type.label}</p>
                        <p className="text-[10px] text-gray-500">{type.desc}</p>
                      </div>
                    </div>
                    {upscaleType === type.id && <CheckCircle2 className="w-4 h-4 text-[#ff1a1a]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              disabled={!preview || isProcessing}
              onClick={handleGenerate}
              className="group relative w-full h-16 rounded-[20px] bg-[#ff1a1a] disabled:bg-gray-800 disabled:grayscale transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm">
                {isProcessing ? (
                  <>Processing Design...</>
                ) : (
                  <>
                    Enhance Quality <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </div>
            </button>

            {/* Hint */}
            <p className="text-[9px] text-gray-600 text-center font-bold uppercase tracking-widest leading-relaxed">
               AI processing uses cloud GPU resources. <br/>Large files may take up to 30 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}





















// import { motion } from "framer-motion";
// import { Maximize, Sparkles, Zap, ShieldCheck } from "lucide-react";

// export default function Upscale() {
//   return (
//     <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
//       {/* Background Decorative Elements */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff1a1a]/5 blur-[120px] rounded-full pointer-events-none" />
      
//       <motion.div 
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="relative z-10 flex flex-col items-center text-center max-w-2xl"
//       >
//         {/* Animated Icon Scanner */}
//         <div className="relative w-32 h-32 mb-8 group">
//           <div className="absolute inset-0 bg-[#ff1a1a]/20 rounded-3xl blur-xl group-hover:bg-[#ff1a1a]/40 transition-all duration-700" />
//           <div className="relative h-full w-full bg-[#0a0a0a] border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden">
//             <Maximize className="w-12 h-12 text-[#ff1a1a]" />
            
//             {/* The Scanning Beam */}
//             <motion.div 
//               animate={{ top: ["-10%", "110%"] }}
//               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
//               className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff1a1a] to-transparent shadow-[0_0_15px_#ff1a1a] z-20"
//             />
//           </div>
//         </div>

//         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/20 text-[#ff1a1a] text-[10px] font-black tracking-[0.3em] uppercase mb-4">
//           <Zap className="w-3 h-3 fill-current" />
//           Experimental Feature
//         </div>

//         <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
//           ULTRA-HD <span className="text-gray-600 tracking-normal font-light">UPSCALING</span>
//         </h1>
        
//         <p className="text-gray-500 text-sm md:text-base max-w-md leading-relaxed mb-10">
//           We are fine-tuning our neural super-resolution models to bring 4K textile textures to your fingertips. Zero loss in detail, maximum clarity.
//         </p>

//         {/* Coming Soon Badge */}
//         <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
//            <span className="text-2xl font-mono font-bold tracking-widest text-white">COMING SOON</span>
//         </div>

//         {/* Feature Teaser Grid */}
//         <div className="grid grid-cols-3 gap-8 mt-16 w-full">
//             <div className="flex flex-col items-center gap-2">
//                 <ShieldCheck className="w-5 h-5 text-gray-700" />
//                 <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Texture Preservation</span>
//             </div>
//             <div className="flex flex-col items-center gap-2">
//                 <Sparkles className="w-5 h-5 text-gray-700" />
//                 <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">AI Denoising</span>
//             </div>
//             <div className="flex flex-col items-center gap-2">
//                 <Maximize className="w-5 h-5 text-gray-700" />
//                 <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">8K Export</span>
//             </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }