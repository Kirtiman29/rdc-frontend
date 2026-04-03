import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { upscaleImage, upscaleBatch, getAIImageUrl } from "@/api/aiApi";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Maximize,
  Zap,
  Upload,
  CheckCircle2,
  ChevronRight,
  RefreshCcw,
  Layers,
  Download,
  X,
} from "lucide-react";

export default function Upscale() {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]); // Batch state
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [upscaleType, setUpscaleType] = useState("textile");
  const [showPreview, setShowPreview] = useState(false); // Modal state


  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!resultUrl) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    if (mode === "batch") {
      let extractedFiles: File[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        if (file.name.endsWith(".zip") || file.type.includes("zip")) {
          try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);
            
            for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
              if (!zipEntry.dir && relativePath.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
                const blob = await zipEntry.async("blob");
                extractedFiles.push(new File([blob], zipEntry.name, { type: blob.type || "image/png" }));
              }
            }
          } catch (err) {
            console.error("Failed to extract zip", err);
          }
        } else {
          extractedFiles.push(file);
        }
      }

      setFiles(extractedFiles);
      if (extractedFiles.length > 0) {
        setPreview(URL.createObjectURL(extractedFiles[0]));
      }
    } else {
      const selected = selectedFiles[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResultUrl(null);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setFiles([]);
    setPreview(null);
    setResultUrl(null);
  };

  const handleGenerate = async () => {
    if (mode === "single" && !file) return;
    if (mode === "batch" && files.length === 0) return;

    try {
      setIsProcessing(true);
      const userId = 1;

      if (mode === "single") {
        const res = await upscaleImage(file!, upscaleType as any, userId);
        if (res && res.image) {
          setResultUrl(res.image);
          setSliderPosition(50);
        }

      } else {
        // 🔥 BATCH → ALWAYS ZIP
        // Create a ZIP from the current files array to send to the backend's zip_file field
        const uploadZip = new JSZip();
        for (let i = 0; i < files.length; i++) {
          uploadZip.file(files[i].name, files[i]);
        }
        const zipBlob = await uploadZip.generateAsync({ type: "blob" });
        const zipFile = new File([zipBlob], "upload.zip", { type: "application/zip" });

        const blob = await upscaleBatch(zipFile, upscaleType, userId);

        // 🔥 direct download
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "upscaled_images.zip";
        a.click();

        window.URL.revokeObjectURL(url);
      }

    } catch (err) {
      console.error("Upscale failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const imageUrl = getAIImageUrl(resultUrl);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `upscaled-${file?.name || 'design.png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      window.open(getAIImageUrl(resultUrl), "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans selection:bg-[#ff1a1a]/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[#ff1a1a]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
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
          {/* LEFT COLUMN: PREVIEW AREA */}
          <div className="lg:col-span-7">
            {!preview ? (
              <label className="group relative flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed border-white/10 rounded-[32px] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#ff1a1a]/50 transition-all cursor-pointer overflow-hidden">
                <div className="flex flex-col items-center gap-4 text-center p-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#ff1a1a]/10 transition-all">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#ff1a1a]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight">
                      {mode === "batch"
                        ? "Drop folder, images, or .ZIP"
                        : "Drop textile design"} or browse
                    </p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-bold">
                      {mode === "batch" ? "Up to 50 files" : "Max 50MB per file"}
                    </p>
                  </div>
                </div>
                <input 
                  type="file" 
                  className="hidden"
                  onChange={onFileChange}
                  accept={mode === "batch" ? "image/*,.zip,application/zip" : "image/*"}
                  multiple
                />
              </label>
            ) : (
              <div 
                className={`relative w-full aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 ${resultUrl ? 'cursor-col-resize' : 'cursor-default'} group`}
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
              >
                <div className="absolute inset-0 bg-[#0a0a0a]">
                  <img 
                    src={resultUrl ? getAIImageUrl(resultUrl) : preview} 
                    className="w-full h-full object-cover" 
                    alt="Display" 
                  />
                </div>

                {/* Change Image Button */}
                <button
                  onClick={resetUpload}
                  className="absolute top-6 right-6 z-30 px-3 py-1 bg-black/80 text-white text-[10px] font-black uppercase rounded-md border border-white/20 hover:border-[#ff1a1a] transition-colors"
                >
                  Change Image
                </button>

                {/* Slider Handle & Split View */}
                {resultUrl && (
                  <>
                    <div 
                      className="absolute inset-0 border-r-2 border-[#ff1a1a] shadow-[10px_0_30px_rgba(255,26,26,0.3)] overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      {/* FIX: No more grayscale/blur */}
                      <img 
                        src={preview} 
                        className="w-full h-full object-cover opacity-90" 
                        alt="Original" 
                        style={{ width: `${100 * (100 / sliderPosition)}%`, maxWidth: 'none' }}
                      />
                      <div className="absolute top-6 left-6 px-3 py-1 bg-black/80 text-white text-[10px] font-black uppercase rounded-md border border-white/20">
                        Before
                      </div>
                    </div>

                    <div className="absolute inset-y-0 pointer-events-none" style={{ left: `${sliderPosition}%` }}>
                      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,26,26,0.5)] border-2 border-[#ff1a1a]">
                        <RefreshCcw className="w-5 h-5 text-black" />
                      </div>
                    </div>
                  </>
                )}

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
                      <p className="text-[#ff1a1a] font-mono text-sm font-bold tracking-[0.3em] animate-pulse uppercase">Scaling Pixels...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: CONTROLS */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* NEW: Mode Switch */}
            <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/10">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">Process Mode</label>
              <div className="flex gap-3">
                {["single", "batch"].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m as any); resetUpload(); }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      mode === m 
                      ? "bg-[#ff1a1a] text-white shadow-[0_0_20px_rgba(255,26,26,0.2)]" 
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {m === "single" ? "Normal" : "Batch"}
                  </button>
                ))}
              </div>
            </div>

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

            <button
              disabled={(!file && files.length === 0) || isProcessing}
              onClick={handleGenerate}
              className="group relative w-full h-16 rounded-[20px] bg-[#ff1a1a] disabled:bg-gray-800 disabled:grayscale transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm text-white">
                {isProcessing ? "Processing..." : <>Enhance Quality <ChevronRight className="w-5 h-5" /></>}
              </div>
            </button>

            {/* NEW: Preview Modal Trigger */}
            <button
              disabled={!resultUrl || isProcessing}
              onClick={() => setShowPreview(true)}
              className="w-full h-12 rounded-[16px] border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all disabled:opacity-20"
            >
              Preview Full Image
            </button>

            <button
              disabled={!resultUrl || isProcessing}
              onClick={mode === "batch" ? handleGenerate : handleDownload}
              className="group w-full h-14 rounded-[18px] border border-[#ff1a1a]/30 bg-white/[0.03] text-white disabled:opacity-20 transition-all hover:bg-[#ff1a1a]/10"
            >
              <div className="flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] text-xs">
                <Download className="w-4 h-4 text-[#ff1a1a]" />
                Download Result
              </div>
            </button>

            <p className="text-[9px] text-gray-600 text-center font-bold uppercase tracking-widest leading-relaxed">
                Cloud GPU Processing Active. <br/>Large files may take up to 30 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* NEW: Full Screen Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          >
            <motion.img 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={getAIImageUrl(resultUrl!)} 
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" 
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-8 right-8 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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