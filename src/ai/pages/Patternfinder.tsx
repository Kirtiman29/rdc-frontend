// path: src/ai/pages/Patternfinder.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Move, Fingerprint, Layers, Scan, 
  Upload, ArrowRight, Zap, CheckCircle2, 
  Sparkles, Download, Wand2, 
  ShieldCheck
} from "lucide-react";

export default function PatternFinder() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleExtract = () => {
    setIsExtracting(true);
    // Simulate Neural Extraction process
    setTimeout(() => setIsExtracting(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff1a1a]/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/20 text-[#ff1a1a] text-[10px] font-black tracking-[0.2em] uppercase mb-4">
              <Fingerprint className="w-3 h-3" /> Pattern Intelligence v1.0
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
              Pattern <span className="text-gray-600 font-light">Extractor</span>
            </h1>
          </motion.div>
          
          <p className="text-gray-500 text-xs md:text-sm max-w-sm uppercase font-bold tracking-widest leading-relaxed">
            Deconstruct real-world <span className="text-white">garments</span> into print-ready <span className="text-white">seamless tiles</span>.
          </p>
        </div>

        {/* MAIN INTERACTIVE AREA */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: SOURCE IMAGE / UPLOAD */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-b from-[#ff1a1a]/20 to-transparent rounded-[32px] blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
            
            {!preview ? (
              <label className="relative flex flex-col items-center justify-center w-full aspect-square bg-[#0a0a0a] border-2 border-dashed border-white/10 rounded-[32px] cursor-pointer hover:border-[#ff1a1a]/50 transition-all overflow-hidden group">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#ff1a1a]/10 transition-all">
                    <Upload className="w-8 h-8 text-gray-500 group-hover:text-[#ff1a1a]" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">Upload Source Image</p>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Garment or Fabric Photo</p>
                  </div>
                </div>
                <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
              </label>
            ) : (
              <div className="relative aspect-square rounded-[32px] overflow-hidden border border-white/10 bg-[#0a0a0a]">
                <img src={preview} className="w-full h-full object-cover opacity-80" alt="Source" />
                
                {/* Extraction Scanner Animation */}
                <AnimatePresence>
                  {isExtracting && (
                    <motion.div 
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-[#ff1a1a] shadow-[0_0_20px_#ff1a1a] z-20"
                    />
                  )}
                </AnimatePresence>
                
                <div className="absolute top-6 left-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest">
                   Source Garment
                </div>
                <button onClick={() => setPreview(null)} className="absolute bottom-6 right-6 p-3 bg-white/10 hover:bg-red-500/20 rounded-full border border-white/10 transition-colors">
                    <RxTrash className="text-white" />
                </button>
              </div>
            )}
          </div>

          {/* CENTER: NEURAL BRIDGE */}
          <div className="lg:col-span-2 flex lg:flex-col items-center justify-center gap-4 py-6">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 ${isExtracting ? 'border-[#ff1a1a] bg-[#ff1a1a]/10 shadow-[0_0_20px_rgba(255,26,26,0.3)]' : 'border-white/10 bg-white/5'}`}>
              {isExtracting ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Layers className="w-6 h-6 text-[#ff1a1a]" /></motion.div> : <ArrowRight className="w-6 h-6 text-gray-600" />}
            </div>
            <div className="hidden lg:block w-[1px] h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 vertical-text hidden lg:block">Neural Extraction</div>
          </div>

          {/* RIGHT: EXTRACTED RESULT */}
          <div className="lg:col-span-5 relative group">
             <div className="relative aspect-square rounded-[32px] overflow-hidden border border-white/10 bg-[#0a0a0a] flex items-center justify-center">
                {/* If no extraction yet, show empty state or grid */}
                {!preview ? (
                   <div className="flex flex-col items-center text-gray-700">
                      <Scan className="w-16 h-16 mb-4 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Analysis</span>
                   </div>
                ) : (
                  <div className="w-full h-full relative">
                    {/* The extracted pattern preview - repeating tile */}
                    <div 
                      className={`absolute inset-0 transition-all duration-1000 ${isExtracting ? 'blur-xl opacity-0 scale-95' : 'blur-0 opacity-100 scale-100'}`}
                      style={{ 
                        backgroundImage: `url(${preview})`, 
                        backgroundSize: '33%',
                        backgroundRepeat: 'repeat' 
                      }}
                    />
                    
                    {/* Overlay Grid */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
                    
                    {isExtracting && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-[#ff1a1a] font-mono text-xs font-black tracking-[0.4em] uppercase"
                          >
                            Isolating Motif...
                          </motion.div>
                       </div>
                    )}
                  </div>
                )}

                <div className="absolute top-6 right-6 px-4 py-2 bg-[#ff1a1a] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                   Print-Ready Tile
                </div>
             </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-16 flex flex-col md:flex-row items-center justify-between p-8 rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-md gap-8"
        >
          <div className="flex gap-10">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Target Format</span>
              <span className="text-xs font-bold text-white uppercase">Seamless Vector (SVG)</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Color Mode</span>
              <span className="text-xs font-bold text-white uppercase">Indexed Textile Palettes</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             <button
              disabled={!preview || isExtracting}
              onClick={handleExtract}
              className="flex-1 md:flex-none px-12 h-16 rounded-2xl bg-[#ff1a1a] hover:bg-[#e60000] disabled:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,26,26,0.2)]"
            >
              <Wand2 className={`w-5 h-5 ${isExtracting ? 'animate-pulse' : ''}`} />
              <span className="font-black uppercase tracking-[0.2em] text-xs">Generate Pattern</span>
            </button>
            
            <button className="p-5 h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
               <Download className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </motion.div>

        {/* FEATURE HIGHLIGHTS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 px-4">
           {[
             { icon: <Move />, text: "Seamless Tiling" },
             { icon: <Sparkles />, text: "Motif Isolation" },
             { icon: <Zap />, text: "Neural Extraction" },
             { icon: <ShieldCheck />, text: "High Res Export" }
           ].map((item, idx) => (
             <div key={idx} className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity">
               <div className="text-[#ff1a1a]">{item.icon}</div>
               <span className="text-[9px] font-black uppercase tracking-widest">{item.text}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

// Custom Icons for deletion since Lucide RxTrash wasn't in original import
function RxTrash({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM4.5 5C4.22386 5 4 5.22386 4 5.5V12.5C4 13.3284 4.67157 14 5.5 14H9.5C10.3284 14 11 13.3284 11 12.5V5.5C11 5.22386 10.7761 5 10.5 5H4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}













// // path: src/ai/pages/Patternfinder.tsx
// import { motion } from "framer-motion";
// import { Search, Move, Fingerprint, Layers, Scan } from "lucide-react";

// export default function PatternFinder() {
//   return (
//     <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
//       {/* Background Radial Glow */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff1a1a]/5 blur-[140px] rounded-full pointer-events-none" />
      
//       {/* Grid Pattern Overlay */}
//       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />

//       <motion.div 
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         className="relative z-10 flex flex-col items-center text-center max-w-3xl"
//       >
//         {/* NEURAL TARGETING ANIMATION */}
//         <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
//           {/* Rotating Outer Ring */}
//           <motion.div 
//             animate={{ rotate: 360 }}
//             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
//             className="absolute inset-0 border border-dashed border-white/10 rounded-full"
//           />
          
//           {/* Pulsing Target Corners */}
//           <div className="absolute inset-4 border-t-2 border-l-2 border-[#ff1a1a] w-6 h-6 rounded-tl-lg" />
//           <div className="absolute inset-4 bottom-4 right-4 left-auto top-auto border-b-2 border-r-2 border-[#ff1a1a] w-6 h-6 rounded-br-lg" />
          
//           <div className="relative w-20 h-20 bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
//             <Scan className="w-10 h-10 text-[#ff1a1a]" />
            
//             {/* The Extraction Wave */}
//             <motion.div 
//               animate={{ opacity: [0, 1, 0], scale: [0.8, 1.5] }}
//               transition={{ duration: 3, repeat: Infinity }}
//               className="absolute inset-0 bg-[#ff1a1a]/20 rounded-2xl"
//             />
//           </div>
//         </div>

//         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-gray-500 text-[10px] font-black tracking-[0.3em] uppercase mb-6">
//           <Fingerprint className="w-3.5 h-3.5 text-[#ff1a1a]" />
//           Pattern Recognition v0.1
//         </div>

//         <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
//           PATTERN <span className="text-[#ff1a1a]">EXTRACTOR</span>
//         </h1>
        
//         <p className="text-gray-400 text-sm md:text-base max-w-lg leading-relaxed mb-12">
//           Upload a photo of any garment or fabric. Our AI will deconstruct the weave, isolate the motif, and convert it into a seamless digital vector.
//         </p>

//         {/* Coming Soon Status */}
//         <div className="group relative">
//           <div className="absolute -inset-1 bg-gradient-to-r from-[#ff1a1a] to-transparent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
//           <div className="relative px-10 py-5 rounded-2xl bg-[#0a0a0a] border border-white/10 backdrop-blur-xl">
//              <span className="text-2xl font-black font-mono tracking-[0.2em] text-white">UNDER DEVELOPMENT</span>
//           </div>
//         </div>

//         {/* Workflow Steps */}
//         <div className="flex items-center gap-12 mt-20 opacity-40">
//             <div className="flex flex-col items-center gap-3">
//                 <div className="p-3 rounded-xl bg-white/5"><Move className="w-5 h-5" /></div>
//                 <span className="text-[9px] font-bold uppercase tracking-widest">1. Capture</span>
//             </div>
//             <div className="h-[1px] w-12 bg-white/10" />
//             <div className="flex flex-col items-center gap-3">
//                 <div className="p-3 rounded-xl bg-white/5"><Layers className="w-5 h-5" /></div>
//                 <span className="text-[9px] font-bold uppercase tracking-widest">2. Isolate</span>
//             </div>
//             <div className="h-[1px] w-12 bg-white/10" />
//             <div className="flex flex-col items-center gap-3">
//                 <div className="p-3 rounded-xl bg-white/5"><Search className="w-5 h-5" /></div>
//                 <span className="text-[9px] font-bold uppercase tracking-widest">3. Vectorize</span>
//             </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }