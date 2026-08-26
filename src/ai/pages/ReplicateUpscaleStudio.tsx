import { useRef, useState } from "react";
import { getToken } from "@/api/apiClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  ImageUp,
  Loader2,
  Maximize,
  RefreshCcw,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import AiCreditCost from "@/ai/components/AiCreditCost";

const REPLICATE_UPSCALE_CREDIT_COST = 10;

type Notice = {
  type: "success" | "error" | "info";
  text: string;
} | null;

type ScaleOption = {
  scale: number;
  label: string;
  badge: string;
  description: string;
};

const scaleOptions: ScaleOption[] = [
  {
    scale: 2,
    label: "2x Upscale",
    badge: "2x HD",
    description: "Doubles dimensions, removes mild compression blur.",
  },
  {
    scale: 4,
    label: "4x Super Resolution",
    badge: "4x Ultra",
    description: "Multiplies dimensions by 4, sharpens edges & fabric slubs.",
  },
  {
    scale: 8,
    label: "8x Extreme 4K/8K",
    badge: "8x Max",
    description: "Multiplies dimensions by 8 for ultra print & billboard scale.",
  },
];

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getSubscriptionServiceBase = () =>
  trimTrailingSlash(
    import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL ||
      import.meta.env.VITE_BASE_URL ||
      "http://localhost:8094"
  );

const getAiServiceBase = () =>
  trimTrailingSlash(
    import.meta.env.VITE_AI_SERVICE_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:8000"
  );

const resolveReplicateUpscaleApiUrl = () => {
  const envBase = getSubscriptionServiceBase();
  return `${envBase}/api/replicate-upscale`;
};

const getResponseImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const origin = getAiServiceBase();
  if (/^https?:\/\//i.test(imageUrl)) {
    try {
      const parsedUrl = new URL(imageUrl);
      if (
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1" ||
        parsedUrl.hostname === "host.docker.internal" ||
        /^192\.168\./.test(parsedUrl.hostname) ||
        /^10\./.test(parsedUrl.hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(parsedUrl.hostname)
      ) {
        return `${origin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      }
    } catch {
      return imageUrl;
    }

    return imageUrl;
  }

  return `${origin}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
};

const upscaleFaqs = [
  {
    question: "What is Replicate Real-ESRGAN Image Upscaling?",
    answer: "Replicate Real-ESRGAN uses deep neural network super-resolution to eliminate compression artifacts, unblur fuzzy design lines, and multiply image dimensions by 2x, 4x, or 8x while preserving sharp details.",
  },
  {
    question: "Which scale factor should I choose?",
    answer: "4x Super Resolution is recommended for most digital artworks and textile patterns. Use 8x Extreme for large format mill production prints or billboards.",
  },
  {
    question: "How long does Replicate upscaling take?",
    answer: "Upscaling typically completes in 5 to 15 seconds depending on original image size and selected scale factor.",
  },
];

export default function ReplicateUpscaleStudio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedScale, setSelectedScale] = useState<number>(4);
  const [faceEnhance, setFaceEnhance] = useState<boolean>(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultDimensions, setResultDimensions] = useState<{ width: number; height: number } | null>(null);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaderText, setLoaderText] = useState("Sending blurry artwork to Replicate Real-ESRGAN...");
  const [notice, setNotice] = useState<Notice>(null);

  const loadFile = (file: File) => {
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      setNotice({ type: "error", text: "Please upload a PNG, JPG, JPEG, or WEBP image." });
      return;
    }

    if (sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    setSourceFile(file);
    setSourceUrl(URL.createObjectURL(file));
    setResultUrl("");
    setResultDimensions(null);
    setSplitPosition(100);
    setNotice({ type: "success", text: `${file.name} loaded for Replicate upscaling.` });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.max(0, Math.min(100, next)));
  };

  const resetWorkspace = () => {
    if (sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    setSourceFile(null);
    setSourceUrl("");
    setResultUrl("");
    setResultDimensions(null);
    setSplitPosition(50);
    setProgress(0);
    setSelectedScale(4);
    setFaceEnhance(false);
    setNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateUpscale = async () => {
    if (!sourceFile) {
      setNotice({ type: "error", text: "Please upload a blurry image to upscale." });
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setNotice(null);

    const steps = [
      "Sending blurry artwork to Replicate Real-ESRGAN...",
      "Analyzing pixel contours & removing noise...",
      "Generating 4K super-resolution details...",
      "Polishing upscaled output...",
    ];

    let localProgress = 10;
    const interval = window.setInterval(() => {
      localProgress = Math.min(92, localProgress + Math.floor(Math.random() * 8) + 4);
      setProgress(localProgress);
      setLoaderText(steps[Math.min(steps.length - 1, Math.floor((localProgress / 100) * steps.length))]);
    }, 500);

    try {
      const formData = new FormData();
      formData.append("image", sourceFile);
      formData.append("scale", String(selectedScale));
      formData.append("face_enhance", String(faceEnhance));

      const token = getToken() || localStorage.getItem("token") || "";
      const response = await fetch(resolveReplicateUpscaleApiUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const dispatchCreditsUpdate = (remainingCredits: unknown) => {
        const remaining =
          typeof remainingCredits === "number"
            ? remainingCredits
            : typeof remainingCredits === "string"
              ? parseInt(remainingCredits, 10)
              : NaN;

        if (!Number.isNaN(remaining)) {
          window.dispatchEvent(
            new CustomEvent("ai-credits-updated", {
              detail: remaining,
            })
          );
        }
      };

      const remainingCreditsHeader = response.headers.get("x-remaining-credits");
      if (remainingCreditsHeader) {
        dispatchCreditsUpdate(remainingCreditsHeader);
      }

      const payload = await response.json().catch(() => null);
      dispatchCreditsUpdate(payload?.remaining_credits ?? payload?.remainingCredits);
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.message || `Replicate upscaling failed (${response.status})`);
      }

      const imageUrl = payload?.image_url || payload?.url || payload?.result_url;
      if (!imageUrl) {
        throw new Error("No upscaled image URL was returned from Replicate service.");
      }

      setResultUrl(`${getResponseImageUrl(imageUrl)}${String(imageUrl).includes("?") ? "&" : "?"}t=${Date.now()}`);
      if (payload?.width && payload?.height) {
        setResultDimensions({ width: payload.width, height: payload.height });
      }
      setSplitPosition(50);
      setProgress(100);
      setNotice({
        type: "success",
        text: `Image successfully upscaled ${selectedScale}x using Replicate Real-ESRGAN!`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Replicate upscaling failed.",
      });
    } finally {
      window.clearInterval(interval);
      setIsGenerating(false);
      setLoaderText("Sending blurry artwork to Replicate Real-ESRGAN...");
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    void (async () => {
      const filename = `replicate_upscaled_${selectedScale}x.png`;

      try {
        const response = await fetch(resultUrl);
        if (!response.ok) throw new Error(`Download failed (${response.status})`);

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } catch {
        const link = document.createElement("a");
        link.href = resultUrl;
        link.download = filename;
        link.rel = "noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#111317] text-white p-4 md:p-8 font-sans selection:bg-[#E11D2E]/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <header className="relative rounded-3xl bg-gradient-to-r from-[#171A21] via-[#151922] to-[#1C1724] border border-[#2B3138] p-6 md:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-semibold uppercase tracking-wider mb-3">
                <Maximize className="w-3.5 h-3.5" /> Replicate Real-ESRGAN AI Super Resolution
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Replicate Upscale Studio
              </h1>
              <p className="text-[#A1A8B3] text-sm md:text-base mt-1 max-w-2xl">
                Unblur, sharpen, and upscale low-resolution images or designs by 2x, 4x, or 8x using Replicate's high-performance Real-ESRGAN super-resolution model.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <AiCreditCost cost={REPLICATE_UPSCALE_CREDIT_COST} className="bg-[#1C2025]/80 border-[#2B3138]" />
              <button
                onClick={resetWorkspace}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#20242A] border border-[#2B3138] text-xs font-semibold text-[#A1A8B3] hover:text-white hover:bg-[#2B3138] transition-all"
              >
                <RefreshCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </header>

        {/* Notices */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${
                notice.type === "error"
                  ? "bg-[#E11D2E]/10 border-[#E11D2E]/30 text-[#FF5263]"
                  : notice.type === "success"
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#34D399]"
                  : "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#60A5FA]"
              }`}
            >
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} className="text-xs opacity-70 hover:opacity-100">
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Upload Image */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageUp className="w-4 h-4 text-[#3B82F6]" /> 1. Upload Blurry Image
              </h2>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  sourceUrl
                    ? "border-[#10B981]/50 bg-[#10B981]/5"
                    : "border-[#2B3138] hover:border-[#3B82F6]/50 bg-[#1C2025]/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) loadFile(file);
                  }}
                  className="hidden"
                />

                {sourceUrl ? (
                  <div className="space-y-3">
                    <img
                      src={sourceUrl}
                      alt="Source artwork"
                      className="max-h-36 mx-auto rounded-lg object-contain shadow-md border border-[#2B3138]"
                    />
                    <p className="text-xs text-[#10B981] font-semibold">
                      {sourceFile?.name || "Image Loaded"} (Click or drag to change)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-8 h-8 text-[#A1A8B3] mx-auto" />
                    <p className="text-xs font-semibold text-white">Click or Drag & Drop image here</p>
                    <p className="text-[10px] text-[#6B7280]">Supports PNG, JPG, JPEG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Select Scale Factor */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Maximize className="w-4 h-4 text-[#3B82F6]" /> 2. Select Scale Factor
              </h2>

              <div className="space-y-3">
                {scaleOptions.map((option) => {
                  const active = selectedScale === option.scale;
                  return (
                    <button
                      key={option.scale}
                      onClick={() => setSelectedScale(option.scale)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        active
                          ? "bg-[#3B82F6]/10 border-[#3B82F6] shadow-lg shadow-[#3B82F6]/10"
                          : "bg-[#1C2025] border-[#2B3138] hover:border-[#3B424A] hover:bg-[#20242A]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{option.label}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#A1A8B3] mt-1">{option.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? "border-[#3B82F6] bg-[#3B82F6]" : "border-[#2B3138]"}`}>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Face Enhance & Generate */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" /> 3. Additional Settings
              </h2>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C2025] border border-[#2B3138]">
                <div>
                  <p className="text-xs font-semibold text-white">Face Detail Restoration</p>
                  <p className="text-[10px] text-[#A1A8B3]">Enhance blurry human faces using GFPGAN</p>
                </div>
                <input
                  type="checkbox"
                  checked={faceEnhance}
                  onChange={(e) => setFaceEnhance(e.target.checked)}
                  className="w-4 h-4 accent-[#3B82F6] rounded cursor-pointer"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateUpscale}
                disabled={isGenerating || !sourceFile}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isGenerating || !sourceFile
                    ? "bg-[#20242A] text-[#6B7280] border border-[#2B3138] cursor-not-allowed"
                    : "bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold shadow-[#3B82F6]/25 hover:scale-[1.01]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" /> {loaderText}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Run Replicate Real-ESRGAN ({REPLICATE_UPSCALE_CREDIT_COST} Credits)
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="space-y-1.5 pt-2">
                  <div className="w-full bg-[#1C2025] h-2 rounded-full overflow-hidden border border-[#2B3138]">
                    <div
                      className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#A1A8B3] text-center font-mono">{progress}% Complete</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview Canvas & Output Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Split Comparison Canvas */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg min-h-[480px] flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-[#3B82F6]" /> Super Resolution Canvas
                </h2>
                {resultUrl && (
                  <button
                    onClick={downloadResult}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-xs font-semibold text-[#60A5FA] hover:bg-[#3B82F6] hover:text-white transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download {selectedScale}x PNG
                  </button>
                )}
              </div>

              {/* Canvas Display */}
              <div className="flex-1 relative rounded-xl border border-[#2B3138] bg-[#111317] overflow-hidden flex items-center justify-center min-h-[380px]">
                {resultUrl && sourceUrl ? (
                  <div
                    className="relative w-full h-full min-h-[400px] select-none cursor-ew-resize overflow-hidden"
                    onPointerDown={() => setIsDragging(true)}
                    onPointerUp={() => setIsDragging(false)}
                    onPointerLeave={() => setIsDragging(false)}
                    onPointerMove={handlePointerMove}
                  >
                    {/* Before Image */}
                    <img
                      src={sourceUrl}
                      alt="Original blurry artwork"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* After Upscaled Image (Clipped) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${splitPosition}%` }}
                    >
                      <img
                        src={resultUrl}
                        alt="Upscaled sharp result"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>

                    {/* Split Line handle */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#3B82F6] cursor-ew-resize z-20"
                      style={{ left: `${splitPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold">
                        ↔
                      </div>
                    </div>

                    {/* Badges */}
                    <span className="absolute bottom-3 left-3 bg-[#111317]/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-[#60A5FA] border border-[#2B3138]">
                      REPLICATE {selectedScale}X UPSCALED
                    </span>
                    <span className="absolute bottom-3 right-3 bg-[#111317]/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-[#A1A8B3] border border-[#2B3138]">
                      ORIGINAL BLURRY
                    </span>
                  </div>
                ) : sourceUrl ? (
                  <div className="relative w-full h-full min-h-[380px] flex items-center justify-center p-4">
                    <img
                      src={sourceUrl}
                      alt="Uploaded blurry artwork"
                      className="max-h-[360px] object-contain rounded-lg shadow-lg border border-[#2B3138]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111317] via-transparent to-transparent flex items-end justify-center pb-6">
                      <p className="text-xs text-[#A1A8B3] font-medium bg-[#181B1F]/90 px-4 py-2 rounded-xl border border-[#2B3138]">
                        Select scale factor ({selectedScale}x) and click "Run Replicate Real-ESRGAN"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <Maximize className="w-12 h-12 text-[#2B3138] mx-auto" />
                    <p className="text-sm font-semibold text-[#A1A8B3]">No Image Loaded</p>
                    <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                      Upload a blurry image or pattern on the left panel to begin Replicate Real-ESRGAN super-resolution.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Output Details */}
            {resultDimensions && (
              <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#3B82F6]" /> Upscale Result Specifications
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                    <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Provider Engine</p>
                    <p className="text-xs text-white font-medium">Replicate Real-ESRGAN</p>
                  </div>
                  <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                    <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Scale Factor</p>
                    <p className="text-xs text-[#60A5FA] font-bold">{selectedScale}x Super Resolution</p>
                  </div>
                  <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                    <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Output Resolution</p>
                    <p className="text-xs text-white font-mono font-semibold">
                      {resultDimensions.width} × {resultDimensions.height} px
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAQs */}
        <section className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-6 md:p-8 space-y-6 shadow-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Maximize className="w-5 h-5 text-[#3B82F6]" /> Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {upscaleFaqs.map((faq, index) => (
              <div key={index} className="border border-[#2B3138] rounded-xl overflow-hidden bg-[#1C2025]">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 text-left font-semibold text-sm text-white flex items-center justify-between hover:bg-[#20242A] transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#A1A8B3] transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === index && (
                  <div className="p-4 pt-0 text-xs text-[#A1A8B3] leading-relaxed border-t border-[#2B3138]/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
