import { useEffect, useState } from "react";
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
  ChevronDown,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import AiCreditEstimate from "@/ai/components/AiCreditEstimate";

import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";

const upscaleCreditMap = {
  smart: 20,
  textile: 10,
  double: 15,
} as const;

const slideshowImages = [pattern1, pattern2, pattern3, pattern4];

const faqs = [
  {
    question: "Can I use these images for my personal or commercial project?",
    answer: "Yes! All designs generated through RDC AI Studio are royalty-free. You hold full rights to use them for both personal and commercial projects, including marketing, product printing, social media, and digital publishing.",
  },
  {
    question: "If I generate content, will it be made available for other customers?",
    answer: "No. Your generated patterns and designs are private to your account and saved under 'My Designs'. They will not be displayed, shared, or made available to other customers unless you explicitly choose to publish them.",
  },
  {
    question: "For content I generate, will it be mine exclusively?",
    answer: "You have full commercial usage rights to your outputs. However, because AI models can generate similar results for similar prompts, the underlying imagery is not legally patentable or exclusively owned in terms of copyright protection, similar to standard generative AI terms.",
  },
  {
    question: "Do you have any safeguards for inappropriate content?",
    answer: "Yes, we employ robust automated safety filters. Any prompts or uploaded images that contain explicit, offensive, or inappropriate content are blocked automatically prior to generation. If a generated image bypasses the filters, please report it immediately.",
  },
  {
    question: "Can I write a prompt in other languages besides English?",
    answer: "Yes! Our AI systems support multi-lingual input and can interpret prompts written in Spanish, French, German, Hindi, and many other major languages. However, English prompts generally produce the most accurate and detailed patterns.",
  },
  {
    question: "How do I report results that seem weird/offensive/illegal?",
    answer: "If you encounter a generated result that is offensive or inappropriate, you can click on the support/report link in the page footer or contact our support team directly. We review reports and adjust safety guidelines constantly.",
  },
  {
    question: "How do I start making AI generated images?",
    answer: "It is simple! Just write a description of the design you want in the prompt textbox, select your style and aspect ratio, and click 'Generate Design'. Our studio will create your visuals in seconds.",
  },
];

export default function Upscale() {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]); // Batch state
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [, setRemainingCredits] = useState<number | null>(null);

  // Popover state
  const [activePopover, setActivePopover] = useState<"mode" | "factor" | "model" | "dimension" | null>(null);

  // Slideshow state
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

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
  const [upscaleType, setUpscaleType] = useState<UpscaleMode>("textile");
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
    <div className="bg-[#111315] text-[#F5F7FA] relative pb-6">
      {/* Top Wrapper to limit Background Slideshow to Header and Generator Card */}
      <div className="relative w-full">
        {/* Background Slideshow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeSlide}
              src={slideshowImages[activeSlide]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.45, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#111315]/85 to-[#111315]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1480px] flex-col gap-8 p-5 md:p-7 xl:p-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#2B3138]/60 pb-6 mt-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2B3138] bg-[#1C2025] px-3 py-1 text-xs font-semibold text-[#A1A8B3]">
                <Sparkles className="h-3.5 w-3.5 text-[#E11D2E]" />
                RDC AI Studio
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                Ultra-HD Upscaler: Neural Engine
              </h1>
            </div>

            <Link
              to="/ai-studio"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2B3138] bg-[#20242A] px-5 text-sm font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31] self-start sm:self-auto"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Generator panel and slideshow slider */}
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            {/* Horizontal Settings Card */}
            <div className="flex-1 rounded-[24px] border border-[#2B3138]/30 bg-[#181B1F]/90 p-6 backdrop-blur-xl shadow-2xl relative z-30 flex flex-col justify-between min-h-[120px]">
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Popover: Process Mode */}
                  <div className={`relative ${activePopover === "mode" ? "z-50" : "z-10"}`}>
                    <button
                      onClick={() => setActivePopover(activePopover === "mode" ? null : "mode")}
                      className="flex items-center gap-2 rounded-xl border border-[#2B3138]/60 bg-[#20242A] px-4 py-2.5 text-xs font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
                    >
                      <span>Mode: {mode === "single" ? "Single" : "Batch"}</span>
                      <ChevronDown className="h-4 w-4 text-[#A1A8B3]" />
                    </button>

                    <AnimatePresence>
                      {activePopover === "mode" && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={() => setActivePopover(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 z-40 mb-2 w-48 rounded-[20px] border border-[#2B3138] bg-[#1C2025] p-3 shadow-2xl space-y-1.5"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A8B3] px-2 mb-1">
                              Process Mode
                            </p>
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
                                  setActivePopover(null);
                                }}
                                className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-300 ${
                                  mode === m
                                    ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white"
                                    : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-white"
                                }`}
                              >
                                {m === "single" ? "Single Image" : "Batch (Folder/.ZIP)"}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Popover: Upscale Factor */}
                  <div className={`relative ${activePopover === "factor" ? "z-50" : "z-10"}`}>
                    <button
                      onClick={() => setActivePopover(activePopover === "factor" ? null : "factor")}
                      className="flex items-center gap-2 rounded-xl border border-[#2B3138]/60 bg-[#20242A] px-4 py-2.5 text-xs font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
                    >
                      <span>Factor: {batchFactor}x</span>
                      <ChevronDown className="h-4 w-4 text-[#A1A8B3]" />
                    </button>

                    <AnimatePresence>
                      {activePopover === "factor" && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={() => setActivePopover(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 z-40 mb-2 w-40 rounded-[20px] border border-[#2B3138] bg-[#1C2025] p-3 shadow-2xl space-y-1.5"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A8B3] px-2 mb-1">
                              Upscale Factor
                            </p>
                            {batchFactors.map((factor) => (
                              <button
                                key={factor}
                                onClick={() => {
                                  setBatchFactor(factor);
                                  setActivePopover(null);
                                }}
                                className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-300 ${
                                  batchFactor === factor
                                    ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white"
                                    : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-white"
                                }`}
                              >
                                {factor}x Scale
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Popover: Optimization Model */}
                  <div className={`relative ${activePopover === "model" ? "z-50" : "z-10"}`}>
                    <button
                      onClick={() => setActivePopover(activePopover === "model" ? null : "model")}
                      className="flex items-center gap-2 rounded-xl border border-[#2B3138]/60 bg-[#20242A] px-4 py-2.5 text-xs font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
                    >
                      <span>Model: {selectedUpscaleLabel}</span>
                      <ChevronDown className="h-4 w-4 text-[#A1A8B3]" />
                    </button>

                    <AnimatePresence>
                      {activePopover === "model" && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={() => setActivePopover(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 z-40 mb-2 w-80 rounded-[20px] border border-[#2B3138] bg-[#1C2025] p-3 shadow-2xl space-y-1.5"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A8B3] px-2 mb-1">
                              Optimization Model
                            </p>
                            {mode === "batch" ? (
                              <button
                                onClick={() => {
                                  setUpscaleType("textile");
                                  setActivePopover(null);
                                }}
                                className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-300 ${
                                  upscaleType === "textile"
                                    ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white"
                                    : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-white"
                                }`}
                              >
                                <div className="font-bold">Textile Fiber AI</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Preserves weave texture · 10 credits</div>
                              </button>
                            ) : (
                              upscaleOptions.map((type) => (
                                <button
                                  key={type.id}
                                  onClick={() => {
                                    setUpscaleType(type.id);
                                    if (type.id === "double") {
                                      setSmartUpscaleOutputMode("increased");
                                    }
                                    setActivePopover(null);
                                  }}
                                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-300 ${
                                    upscaleType === type.id
                                      ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white"
                                      : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-white"
                                  }`}
                                >
                                  <div className="font-bold">{type.label}</div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">{type.desc}</div>
                                </button>
                              ))
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Popover: Output Dimension */}
                  {showOutputDimensionOptions && (
                    <div className={`relative ${activePopover === "dimension" ? "z-50" : "z-10"}`}>
                      <button
                        onClick={() => setActivePopover(activePopover === "dimension" ? null : "dimension")}
                        className="flex items-center gap-2 rounded-xl border border-[#2B3138]/60 bg-[#20242A] px-4 py-2.5 text-xs font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
                      >
                        <span>Size: {smartUpscaleOutputMode === "original" ? "Original" : "Increased Pixels"}</span>
                        <ChevronDown className="h-4 w-4 text-[#A1A8B3]" />
                      </button>

                      <AnimatePresence>
                        {activePopover === "dimension" && (
                          <>
                            <div
                              className="fixed inset-0 z-30 cursor-default"
                              onClick={() => setActivePopover(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full left-0 z-40 mb-2 w-64 rounded-[20px] border border-[#2B3138] bg-[#1C2025] p-3 shadow-2xl space-y-1.5"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A8B3] px-2 mb-1">
                                Output Dimension
                              </p>
                              <button
                                onClick={() => {
                                  setSmartUpscaleOutputMode("original");
                                  setActivePopover(null);
                                }}
                                className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-300 ${
                                  smartUpscaleOutputMode === "original"
                                    ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white"
                                    : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-white"
                                }`}
                              >
                                Original Dimension
                              </button>
                              <button
                                onClick={() => {
                                  setSmartUpscaleOutputMode("increased");
                                  setActivePopover(null);
                                }}
                                className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-300 ${
                                  smartUpscaleOutputMode === "increased"
                                    ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white"
                                    : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-white"
                                }`}
                              >
                                Increased Pixels
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                </div>

                {/* Action button */}
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase tracking-wider text-[#A1A8B3]">Cost</p>
                    <p className="text-xs font-bold text-[#ff9ba5]">
                      {mode === "batch"
                        ? `${estimatedUpscaleCost} Credits/Img`
                        : `${estimatedUpscaleCost} Credits`}
                    </p>
                  </div>

                  <button
                    disabled={(!file && files.length === 0) || isProcessing}
                    onClick={handleGenerate}
                    className="flex items-center gap-2 rounded-xl bg-[#E11D2E] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#FF3347] disabled:opacity-40 shadow-[0_4px_12px_rgba(225,29,46,0.3)] hover:shadow-[0_6px_20px_rgba(225,29,46,0.4)]"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    <span>{isProcessing ? "PROCESSING..." : "ENHANCE QUALITY"}</span>
                  </button>
                </div>
              </div>

            </div>


          </div>
        </div>
      </div>

      {/* Main content below the slideshow (Results & Marketing sections) */}
      <div className="relative z-10 mx-auto flex max-w-[1480px] flex-col gap-8 p-5 md:p-7 xl:p-8 pt-0">
        
        {/* Workspace / Output Area */}
        <div className="mt-8 border-t border-[#2B3138]/40 pt-8 flex flex-col items-center justify-center">
          
          <div className="w-full max-w-4xl">
            {/* Upload/preview area */}
            {!preview ? (
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center w-full aspect-[16/10] border border-dashed ${isDragOver ? "border-[#E11D2E] bg-white/[0.05]" : "border-[#2B3138]/60 bg-[#181B1F]/40"} rounded-[24px] hover:bg-[#181B1F]/60 hover:border-[#E11D2E]/50 transition-all cursor-pointer overflow-hidden`}
              >
                <div className="flex flex-col items-center gap-4 text-center p-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#1C2025] border border-[#2B3138] flex items-center justify-center group-hover:scale-110 group-hover:border-[#E11D2E]/50 transition-all">
                    <Upload className="w-8 h-8 text-[#A1A8B3] group-hover:text-[#E11D2E]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-white">
                      {mode === "batch"
                        ? "Drop folder or .ZIP"
                        : "Drop textile design here"} or browse
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
                className={`relative w-full aspect-[16/10] rounded-[24px] overflow-hidden border border-[#2B3138] ${resultUrl ? 'cursor-col-resize select-none touch-none' : 'cursor-default'} group`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div className="absolute inset-0 bg-black">
                  <img
                    src={resultUrl ? getAIImageUrl(resultUrl) : preview}
                    className="w-full h-full object-contain bg-black/40"
                    alt="Display"
                  />
                </div>

                {/* Slider Handle & Split View */}
                {resultUrl && (
                  <>
                    <div
                      className="absolute inset-y-0 left-0 border-r-2 border-[#E11D2E] shadow-[10px_0_30px_rgba(225,29,46,0.3)] overflow-hidden pointer-events-none"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img
                        src={preview}
                        className="w-full h-full object-contain bg-black/40 opacity-90"
                        alt="Original"
                        style={{ width: `${100 * (100 / sliderPosition)}%`, maxWidth: 'none' }}
                      />
                      <div className="absolute top-6 left-6 px-3 py-1 bg-black/80 text-white text-[10px] font-black uppercase rounded-md border border-white/20">
                        Before
                      </div>
                    </div>

                    <div className="absolute inset-y-0 pointer-events-none" style={{ left: `${sliderPosition}%` }}>
                      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,46,0.5)] border-2 border-[#E11D2E]">
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
                    className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-[#E11D2E] border border-white/10 flex items-center justify-center transition-all hover:scale-105"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4 text-white" />
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
                    className="absolute bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105"
                    title="Preview Full Image"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                )}

                {/* Processing Overlay */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                    >
                      <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 bg-[#E11D2E]/20 rounded-2xl blur-xl animate-pulse" />
                        <div className="relative h-full w-full bg-[#181B1F] border border-[#E11D2E]/30 rounded-2xl flex items-center justify-center overflow-hidden">
                          <Maximize className="w-10 h-10 text-[#E11D2E]" />
                          <motion.div
                            animate={{ top: ["-10%", "110%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-[#E11D2E] shadow-[0_0_15px_#E11D2E] z-20"
                          />
                        </div>
                      </div>
                      <p className="text-[#E11D2E] font-mono text-sm font-bold tracking-[0.3em] animate-pulse uppercase">Scaling Pixels...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* GPU processing banner */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[20px] bg-[#181B1F]/60 border border-[#2B3138]/40 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#E11D2E]/10 border border-[#E11D2E]/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#E11D2E]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#E11D2E] animate-pulse shadow-[0_0_8px_#E11D2E]" />
                     <p className="text-xs font-bold text-white uppercase tracking-wider">
                       Cloud GPU Processing Active
                     </p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Upscaling takes about 1-2 minutes depending on resolution.
                  </p>
                </div>
              </div>

              {preview && !isProcessing && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    disabled={mode === "batch" ? files.length === 0 : !resultUrl}
                    onClick={mode === "batch" ? handleGenerate : handleDownload}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#20242A] border border-[#2B3138]/60 hover:border-[#E11D2E]/50 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-[#252A31] disabled:opacity-30"
                  >
                    <Download className="w-4 h-4 text-[#E11D2E]" />
                    <span>{mode === "batch" ? "Download ZIP" : "Download Result"}</span>
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Promotional Info / Description Sections */}
        <div className="mt-16 space-y-20 border-t border-[#2B3138]/40 pt-16 pb-8">
          {/* Section 1: Introducing GPT Image 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Introducing GPT Image 2
              </h2>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                OpenAI's GPT Image 2 marks a major step forward in AI-powered image generation, turning simple prompts into detailed, production-ready visuals with greater accuracy, control, and creative range. Built to handle complex instructions, it can render precise cases like marketing campaigns, social media content, storyboarding, and educational graphics.
              </p>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                With flexible aspect ratios and the ability to generate cohesive sets of visuals, it streamlines the path from concept to execution. Now available in Shutterstock's AI image generator, GPT Image 2 helps creators move from idea to high-quality visuals faster and more efficiently.
              </p>
            </div>
            <div className="relative group overflow-hidden rounded-[24px] border border-[#2B3138] bg-[#1C2025] p-2 transition-all duration-300 hover:border-[#E11D2E]/40 hover:shadow-2xl">
              <img
                src={gptImage2Showcase}
                alt="GPT Image 2 Showcase"
                className="w-full h-[300px] md:h-[340px] rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Section 2: More AI Images for Less */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative group overflow-hidden rounded-[24px] border border-[#2B3138] bg-[#1C2025] p-2 transition-all duration-300 hover:border-[#E11D2E]/40 hover:shadow-2xl order-2 md:order-1">
              <img
                src={flamingoShowcase}
                alt="Flamingo Showcase"
                className="w-full h-[300px] md:h-[340px] rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                More AI Images for Less
              </h2>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                Generate AI images at scale with our affordable <span className="text-white underline cursor-pointer hover:text-[#E11D2E] transition-colors">Generative AI Plus plan</span>. Get 100 generations a month, each producing four high-quality images, for up to 400 images total.
              </p>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                Want to test it out? Get started with two free image generations! Each AI-generation includes a high-res download, and full rights so you can use them commercially.
              </p>
            </div>
          </div>

          {/* Section 3: How the AI Image Generator Works */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                How the AI Image Generator Works
              </h2>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                Our AI image generator, powered by models like Google's Gemini 3.1 Flash, Imagen 4 Ultra, and GPT Image 2 from OpenAI, lets you create high-quality AI generated images from just a few words.
              </p>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                Choose from a variety of <span className="text-white underline cursor-pointer hover:text-[#E11D2E] transition-colors">AI styles</span>—including Oil painting, Fish eye, or Motion blur—and select your preferred aspect ratio to match your creative vision.
              </p>
            </div>
            <div className="relative group overflow-hidden rounded-[24px] border border-[#2B3138] bg-[#1C2025] p-2 transition-all duration-300 hover:border-[#E11D2E]/40 hover:shadow-2xl">
              <img
                src={colorfulCharacterShowcase}
                alt="Colorful Character Showcase"
                className="w-full h-[300px] md:h-[340px] rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 border-t border-[#2B3138]/40 pt-10 pb-8 max-w-6xl mx-auto w-full px-4">
          <h2 className="text-2xl font-extrabold text-center text-white tracking-tight mb-8">
            AI Ultra-HD Upscaler: FAQs
          </h2>
          <div className="space-y-0">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="border-b border-[#2B3138]/30 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between py-3 text-left group"
                  >
                    <span className="text-sm md:text-base font-bold text-[#F5F7FA] group-hover:text-[#E11D2E] transition-colors leading-relaxed pr-6">
                      {faq.question}
                    </span>
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-[#2B3138]/60 group-hover:border-[#E11D2E]/40 text-[#A1A8B3] group-hover:text-[#E11D2E] transition-all duration-300">
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 text-sm leading-relaxed text-[#A1A8B3] pt-1">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          >
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={resultUrl ? getAIImageUrl(resultUrl) : ""}
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
