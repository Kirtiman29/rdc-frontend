import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { upscaleImage, getAIImageUrl, type UpscaleMode } from "@/api/aiApi";
import JSZip from "jszip";
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
import AiCreditEstimate from "@/ai/components/AiCreditEstimate";

const upscaleCreditMap = {
  smart: 20,
  textile: 10,
  double: 15,
} as const;

export default function Upscale() {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]); // Batch state
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [, setRemainingCredits] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const mockEvent = {
        target: { files: e.dataTransfer.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await onFileChange(mockEvent);
    }
  };
  const [sliderPosition, setSliderPosition] = useState(50);
  const [upscaleType, setUpscaleType] = useState<UpscaleMode>("smart");
  const [showPreview, setShowPreview] = useState(false); // Modal state
  const [isDragging, setIsDragging] = useState(false);

  const upscaleOptions: Array<{ id: UpscaleMode; label: string; desc: string }> = [
    { id: "smart", label: "Smart Upscale", desc: "AI reconstruction + upscale (20 credits)" },
    { id: "textile", label: "Textile Fiber AI", desc: "Preserves thread detail & weave texture (10 credits)" },
    { id: "double", label: "Double Scale Ultra", desc: "Maximum smoothness for prints (15 credits)" },
  ];

  // Batch upscale factors
  const batchFactors = [2, 4, 8];
  const [batchFactor, setBatchFactor] = useState(2);
  const showOutputDimensionOptions =
    mode === "single" && (upscaleType === "smart" || upscaleType === "textile");
  const [smartUpscaleOutputMode, setSmartUpscaleOutputMode] = useState<"original" | "increased">("increased");
  const getSizeMode = () =>
    smartUpscaleOutputMode === "original" ? "same_dimensions" : "increase_pixels";
  const estimatedUpscaleCost = upscaleCreditMap[upscaleType];
  const selectedUpscaleLabel =
    upscaleOptions.find((option) => option.id === upscaleType)?.label || "Upscale";

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!resultUrl) return;
    setIsDragging(true);
    if (e.currentTarget && 'setPointerCapture' in e.currentTarget) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !resultUrl) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (e.currentTarget && 'releasePointerCapture' in e.currentTarget) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    if (mode === "batch") {
      const extractedFiles: File[] = [];

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
        const url = URL.createObjectURL(extractedFiles[0]);
        setPreview(url);
      }
    } else {
      const selected = selectedFiles[0];
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
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

      if (mode === "single") {
        const res = await upscaleImage(file!, upscaleType, {
          scale: batchFactor,
          sizeMode: getSizeMode(),
        });
        setRemainingCredits(res.remainingCredits ?? null);
        if (res && res.image) {
          setResultUrl(res.image);
          setSliderPosition(50);
        }

      } else {
        const resultZip = new JSZip();

        for (let i = 0; i < files.length; i++) {
          const sourceFile = files[i];
          const response = await upscaleImage(sourceFile, upscaleType, {
            scale: batchFactor,
            sizeMode: "increase_pixels",
            batch: i === 0,
          });
          setRemainingCredits(response.remainingCredits ?? null);

          if (!response.image) {
            throw new Error(`Upscale failed for ${sourceFile.name}`);
          }

          const assetResponse = await fetch(getAIImageUrl(response.image));
          const blob = await assetResponse.blob();
          resultZip.file(`upscaled-${sourceFile.name}`, blob);
        }

        const zippedOutput = await resultZip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(zippedOutput);

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
          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
              Textile Fidelity: <span className="text-white">Enhanced</span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN: PREVIEW AREA */}

          <div className="lg:col-span-7">
            {/* Upload/preview area */}
            {!preview ? (
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed ${isDragOver ? "border-[#ff1a1a] bg-white/[0.05]" : "border-white/10 bg-white/[0.02]"} rounded-[32px] hover:bg-white/[0.04] hover:border-[#ff1a1a]/50 transition-all cursor-pointer overflow-hidden`}
              >
                <div className="flex flex-col items-center gap-4 text-center p-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#ff1a1a]/10 transition-all">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#ff1a1a]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight">
                      {mode === "batch"
                        ? "Drop folder or .ZIP"
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
                className={`relative w-full aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 ${resultUrl ? 'cursor-col-resize select-none touch-none' : 'cursor-default'} group`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div className="absolute inset-0 bg-[#0a0a0a]">
                  <img
                    src={resultUrl ? getAIImageUrl(resultUrl) : preview}
                    className="w-full h-full object-cover"
                    alt="Display"
                  />
                </div>

                {/* Slider Handle & Split View */}
                {resultUrl && (
                  <>
                    <div
                      className="absolute inset-0 border-r-2 border-[#ff1a1a] shadow-[10px_0_30px_rgba(255,26,26,0.3)] overflow-hidden pointer-events-none"
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

                {/* Change Image Button (Cross) */}
                {!isProcessing && (
                  <button
                    onClick={resetUpload}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md hover:bg-red-500/20 border border-white/20 flex items-center justify-center transition-all hover:scale-105"
                    title="Remove Image"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}

                {/* Preview Full Image Overlay Button */}
                {resultUrl && !isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPreview(true);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105"
                    title="Preview Full Image"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
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

            {/* Output dimension mode below upload area */}
            {showOutputDimensionOptions && (
              <div className="mt-4 rounded-[24px] border border-[#ff1a1a]/20 bg-[#ff1a1a]/8 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff1a1a] text-center sm:text-left">
                  Output Dimension
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSmartUpscaleOutputMode("original")}
                    className={`rounded-2xl border px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] transition-all ${
                      smartUpscaleOutputMode === "original"
                        ? "border-[#ff1a1a]/50 bg-[#ff1a1a] text-white shadow-[0_0_20px_rgba(255,26,26,0.2)]"
                        : "border-white/10 bg-black/20 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Original Dimension
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartUpscaleOutputMode("increased")}
                    className={`rounded-2xl border px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] transition-all ${
                      smartUpscaleOutputMode === "increased"
                        ? "border-[#ff1a1a]/50 bg-[#ff1a1a] text-white shadow-[0_0_20px_rgba(255,26,26,0.2)]"
                        : "border-white/10 bg-black/20 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Increased Pixels
                  </button>
                </div>
              </div>
            )}

            {/* GPU processing banner */}
            <div className="mt-8 flex items-center gap-5 p-6 rounded-[24px] bg-white/[0.02] border border-white/5 backdrop-blur-md">
              <div className="p-3.5 rounded-2xl bg-[#ff1a1a]/10 shrink-0 border border-[#ff1a1a]/20 shadow-[0_0_20px_rgba(255,26,26,0.15)] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#ff1a1a]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#ff1a1a] animate-pulse shadow-[0_0_10px_#ff1a1a]" />
                   <p className="text-xs font-black text-white uppercase tracking-[0.2em]">
                     Cloud GPU Processing Active
                   </p>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-4">
                  Large files may take up to <span className="text-white bg-white/10 px-1.5 py-0.5 rounded ml-1">1-2 Minutes</span>.
                </p>
              </div>
            </div>
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
                    onClick={() => {
                      const nextMode = m as "single" | "batch";
                      setMode(nextMode);
                      if (nextMode === "batch") {
                        setSmartUpscaleOutputMode("increased");
                      }
                      resetUpload();
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === m
                      ? "bg-[#ff1a1a] text-white shadow-[0_0_20px_rgba(255,26,26,0.2)]"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                  >
                    {m === "single" ? "Normal" : "Batch"}
                  </button>
                ))}
              </div>
            </div>

            {/* Upscale factor options (for both single and batch modes) */}
            <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/10">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">Upscale Factor</label>
              <div className="flex gap-3">
                {batchFactors.map((factor) => (
                  <button
                    key={factor}
                    onClick={() => setBatchFactor(factor)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${batchFactor === factor
                      ? "bg-[#ff1a1a] text-white shadow-[0_0_20px_rgba(255,26,26,0.2)]"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                  >
                    {factor}x
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/10">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">Optimization Model</label>
              <div className="flex flex-col gap-3">
                {mode === "batch"
                  ? (
                    <button
                      key="textile"
                      onClick={() => setUpscaleType("textile")}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${upscaleType === "textile"
                        ? "bg-white/10 border-[#ff1a1a]/50"
                        : "bg-white/5 border-transparent opacity-60 hover:opacity-100"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${upscaleType === "textile" ? "bg-[#ff1a1a] text-white" : "bg-white/10"}`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase">Textile Fiber AI</p>
                          <p className="text-[10px] text-gray-500">Preserves thread detail & weave texture · 10 credits</p>
                        </div>
                      </div>
                      {upscaleType === "textile" && <CheckCircle2 className="w-4 h-4 text-[#ff1a1a]" />}
                    </button>
                  )
                  : (
                    upscaleOptions.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setUpscaleType(type.id);
                          if (type.id === "double") {
                            setSmartUpscaleOutputMode("increased");
                          }
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${upscaleType === type.id
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
                    ))
                  )
                }
              </div>

            </div>

            <AiCreditEstimate
              breakdown={
                mode === "batch" ?
                  `${selectedUpscaleLabel} x ${estimatedUpscaleCost} Credits Per Image`
                : `${selectedUpscaleLabel} x ${estimatedUpscaleCost} Credits`
              }
              totalCredits={estimatedUpscaleCost}
              title={mode === "batch" ? "Per Image Estimate" : "Estimated Usage"}
            />

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

            <button
              disabled={mode === "batch" ? files.length === 0 || isProcessing : !resultUrl || isProcessing}
              onClick={mode === "batch" ? handleGenerate : handleDownload}
              className="group w-full h-14 rounded-[18px] border border-[#ff1a1a]/30 bg-white/[0.03] text-white disabled:opacity-20 transition-all hover:bg-[#ff1a1a]/10"
            >
              <div className="flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] text-xs">
                <Download className="w-4 h-4 text-[#ff1a1a]" />
                {mode === "batch" ? "Download ZIP" : "Download Result"}
              </div>
            </button>

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
