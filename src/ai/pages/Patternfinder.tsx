import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Move, Fingerprint, Layers, Scan, 
  Upload, ArrowRight, Zap, CheckCircle2, 
  Sparkles, Download, Wand2, X, Maximize2,
  ShieldCheck
} from "lucide-react";
import {
  generateSeamlessPattern,
  getAIImageUrl,
  getAiErrorMessage,
} from "../../api/aiApi";
import toast from "react-hot-toast";
import AiCreditCost from "@/ai/components/AiCreditCost";

export default function PatternFinder() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const mockEvent = {
        target: { files: e.dataTransfer.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileChange(mockEvent);
    }
  };
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResultImage(null); // Reset previous result
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);
    try {
      const response = await generateSeamlessPattern(file);
      if (response.success && response.output_image) {
        setResultImage(getAIImageUrl(response.output_image));
        toast.success(response.message || "Pattern generated successfully");
      } else {
        toast.error("Failed to generate pattern");
      }
    } catch (error) {
      console.error(error);
      toast.error(getAiErrorMessage(error, "Error generating pattern"));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      const resp = await fetch(resultImage);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seamless-pattern-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Failed to download image");
    }
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
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase flex items-center gap-4">
              Pattern <span className="text-gray-600 font-light">Extractor</span>
            </h1>
          </motion.div>
          
          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="text-gray-500 text-xs md:text-sm max-w-sm uppercase font-bold tracking-widest leading-relaxed">
              Deconstruct real-world <span className="text-white">garments</span> into print-ready <span className="text-white">seamless tiles</span>.
            </p>
            <AiCreditCost credits={7} label="Per Pattern" />
          </div>
        </div>

        {/* MAIN INTERACTIVE AREA */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: SOURCE IMAGE / UPLOAD */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-b from-[#ff1a1a]/20 to-transparent rounded-[32px] blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
            
            {!preview ? (
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed ${isDragOver ? "border-[#ff1a1a] bg-[#ff1a1a]/5" : "border-white/10 bg-[#0a0a0a]"} rounded-[32px] cursor-pointer hover:border-[#ff1a1a]/50 transition-all overflow-hidden group`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#ff1a1a]/10 transition-all">
                    <Upload className="w-8 h-8 text-gray-500 group-hover:text-[#ff1a1a]" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">Upload Source Image</p>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Garment or Fabric Photo</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={onFileChange} 
                  accept="image/*" 
                  ref={fileInputRef} 
                />
              </label>
            ) : (
              <div className="relative aspect-square rounded-[32px] overflow-hidden border border-white/10 bg-[#0a0a0a]">
                <img src={preview} className="w-full h-full object-cover opacity-80" alt="Source" />
                
                {/* Extraction Scanner Animation */}
                <AnimatePresence>
                  {isExtracting && (
                    <motion.div 
                      key="scanner"
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-[#ff1a1a] shadow-[0_0_20px_#ff1a1a] z-20"
                    />
                  )}
                </AnimatePresence>
                
                <div className="absolute top-6 left-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#ff1a1a] flex items-center gap-2">
                  <Scan className="w-4 h-4" /> Source Image
                </div>
                {!isExtracting && (
                  <button 
                    onClick={() => { setPreview(null); setFile(null); setResultImage(null); }} 
                    className="absolute bottom-6 right-6 p-4 bg-black/50 backdrop-blur-md hover:bg-red-500/20 rounded-full border border-white/10 transition-colors z-30"
                    title="Remove Image"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CENTER: NEURAL BRIDGE */}
          <div className="lg:col-span-2 flex lg:flex-col items-center justify-center gap-4 py-6">
            <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-500 z-10 ${isExtracting || resultImage ? 'border-[#ff1a1a] bg-[#ff1a1a]/10 shadow-[0_0_30px_rgba(255,26,26,0.4)]' : 'border-white/10 bg-white/5'}`}>
              {isExtracting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                  <Layers className="w-6 h-6 text-[#ff1a1a]" />
                </motion.div>
              ) : resultImage ? (
                <CheckCircle2 className="w-6 h-6 text-[#ff1a1a]" />
              ) : (
                <ArrowRight className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div className="hidden lg:block w-[2px] h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 vertical-text hidden lg:block" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              {isExtracting ? (
                <motion.span 
                  animate={{ opacity: [0.5, 1, 0.5] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-[#ff1a1a]"
                >
                  Neural Extraction
                </motion.span>
              ) : resultImage ? (
                <span className="text-white">Extraction Complete</span>
              ) : (
                "Neural Extraction"
              )}
            </div>
          </div>

          {/* RIGHT: EXTRACTED RESULT */}
          <div className="lg:col-span-5 relative group">
             <div className="relative aspect-square rounded-[32px] overflow-hidden border border-white/10 bg-[#0a0a0a] flex items-center justify-center">
                
                {/* Before any operation */}
                {!preview && !resultImage && (
                   <div className="flex flex-col items-center text-gray-700">
                      <Scan className="w-16 h-16 mb-4 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Analysis</span>
                   </div>
                )}
                
                {/* Uploaded but not generated / Generating */}
                {preview && !resultImage && (
                  <div className="w-full h-full relative">
                    <div 
                      className={`absolute inset-0 transition-all duration-1000 ${isExtracting ? 'blur-xl opacity-20 scale-95' : 'blur-0 opacity-40 scale-100 grayscale'}`}
                      style={{ 
                        backgroundImage: `url(${preview})`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
                    
                    {isExtracting && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="bg-black/60 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 flex flex-col items-center gap-3"
                          >
                            <Wand2 className="w-6 h-6 text-[#ff1a1a] animate-pulse" />
                            <span className="text-[#ff1a1a] font-mono text-xs font-black tracking-[0.4em] uppercase">
                              Isolating Motif...
                            </span>
                          </motion.div>
                       </div>
                    )}
                  </div>
                )}

                {/* Generated Pattern Result */}
                {resultImage && (
                  <div className="w-full h-full relative group/result">
                    <div 
                      className="absolute inset-0 transition-transform duration-700 ease-in-out group-hover/result:scale-105"
                      style={{ 
                        backgroundImage: `url(${resultImage})`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat' 
                      }}
                    />
                    {/* Dark overlay that appears on hover for actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover/result:bg-black/40 transition-all duration-300 backdrop-blur-[2px] opacity-0 group-hover/result:opacity-100 flex items-center justify-center gap-4">
                      <button 
                        onClick={() => setIsFullscreen(true)}
                        className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110"
                        title="Preview Fullscreen"
                      >
                        <Maximize2 className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
                )}

                <div className={`absolute top-6 right-6 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border ${resultImage ? 'bg-[#ff1a1a] text-white border-[#ff1a1a]/50' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                   Print-Ready Tile
                </div>
             </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-16 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-md gap-6 md:gap-8 relative z-20"
        >
          <div className="flex flex-wrap gap-8 md:gap-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Move className="w-3 h-3" /> Target Format</span>
              <span className="text-xs font-bold text-white uppercase">Seamless Tile (PNG)</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> AI Model</span>
              <span className="text-xs font-bold text-white uppercase">Neural Extractor v1</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             <button
              disabled={!preview || isExtracting}
              onClick={handleExtract}
              className={`flex-1 md:flex-none px-8 md:px-12 h-16 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                !preview || isExtracting 
                  ? 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed' 
                  : 'bg-[#ff1a1a] hover:bg-[#e60000] text-white shadow-[0_0_30px_rgba(255,26,26,0.2)] hover:shadow-[0_0_40px_rgba(255,26,26,0.4)]'
              }`}
            >
              <Wand2 className={`w-5 h-5 ${isExtracting ? 'animate-pulse' : ''}`} />
              <span className="font-black uppercase tracking-[0.2em] text-xs">
                {isExtracting ? 'Extracting...' : resultImage ? 'Regenerate' : 'Generate Pattern'}
              </span>
            </button>
            
            <button 
              disabled={!resultImage || isExtracting}
              onClick={handleDownload}
              className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all ${
                resultImage && !isExtracting 
                  ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white cursor-pointer hover:scale-105'
                  : 'bg-white/5 border-white/10 text-gray-600 cursor-not-allowed'
              }`}
              title="Download Pattern"
            >
               <Download className="w-5 h-5" />
            </button>
          </div>
        </motion.div>


      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      <AnimatePresence>
        {isFullscreen && resultImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl"
          >
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
              <div className="px-4 py-2 bg-black/50 border border-white/10 rounded-xl flex items-center gap-3">
                <Scan className="w-4 h-4 text-[#ff1a1a]" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Full Design Preview</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-3 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Download Tile</span>
                </button>
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Full-size single image preview */}
            <div className="w-full h-full p-4 md:p-24 overflow-hidden relative">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="w-full h-full rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center"
              >
                <img
                  src={resultImage}
                  alt="Full design preview"
                  className="max-w-full max-h-full object-contain"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
