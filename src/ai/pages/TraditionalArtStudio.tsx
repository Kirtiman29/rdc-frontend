import { useMemo, useRef, useState } from "react";
import { getToken } from "@/api/apiClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  ImageUp,
  Loader2,
  Palette,
  RefreshCcw,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import AiCreditCost from "@/ai/components/AiCreditCost";
import { getModelProviderLabel } from "@/ai/constants/modelProviders";
import type { TextToImageProvider } from "@/api/aiApi";

const TRADITIONAL_ART_CREDIT_COST = 10;

type CraftOption = {
  value: string;
  title: string;
  code: string;
  description: string;
  origin: string;
  accent: string;
  badge: string;
};

type CraftGuide = {
  title: string;
  description: string;
  ground: string;
  technique: string;
  characteristics: string;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
} | null;

const craftOptions: CraftOption[] = [
  {
    value: "madhubani",
    title: "Madhubani Art",
    code: "MTH",
    description: "Double-line black contours, natural vermilion/indigo pigments, and geometric fish & lotus folk fills.",
    origin: "Mithila, Bihar",
    accent: "#E11D2E",
    badge: "Folk Painting",
  },
  {
    value: "warli",
    title: "Warli Tribal Art",
    code: "WRL",
    description: "White rice-paste linework on earthy red-mud background with minimal geometric human silhouettes.",
    origin: "Maharashtra Tribal",
    accent: "#F97316",
    badge: "Tribal Art",
  },
  {
    value: "ikkat",
    title: "Authentic Ikat Weave",
    code: "IKT",
    description: "Feathered yarn-bled borders, warp/weft resist-dyed thread blur, and natural woven relief.",
    origin: "Odisha / Telangana",
    accent: "#3B82F6",
    badge: "Woven Textile",
  },
  {
    value: "bandhani",
    title: "Bandhani Tie-Dye",
    code: "BND",
    description: "Pinched tie-resist dots, ring clusters, soft dye halos, and traditional maroon/saffron fields.",
    origin: "Gujarat / Rajasthan",
    accent: "#EC4899",
    badge: "Tie-Resist Dye",
  },
  {
    value: "ajrakh",
    title: "Ajrakh Block Print",
    code: "AJK",
    description: "Complex geometric resist block printing using natural indigo, madder red, and cream negative space.",
    origin: "Kutch, Gujarat",
    accent: "#14B8A6",
    badge: "Resist Print",
  },
  {
    value: "handblock",
    title: "Hand Block Print",
    code: "BLK",
    description: "Carved wooden block impressions with subtle pressure variation, broken pigment, and Sanganeri florals.",
    origin: "Bagru / Sanganer",
    accent: "#F59E0B",
    badge: "Block Print",
  },
];

const guideMap: Record<string, CraftGuide> = {
  madhubani: {
    title: "Madhubani / Mithila Folk Painting",
    description:
      "Traditional Bihari folk art characterized by bold double-line outlines, vibrant mineral colors, and intricate parallel line fills representing nature, deities, and daily rituals.",
    ground: "Handmade paper, cotton fabric, or mud wall",
    technique: "Twig, nib, and finger application with natural dye pigments",
    characteristics: "Double-line borders, zero negative space, hatching line fills",
  },
  warli: {
    title: "Warli Tribal Wall Art",
    description:
      "Minimalist Indian tribal art originating from Western Ghats using basic geometric shapes (triangles, circles) to represent human figures, animals, and harvest dance rituals.",
    ground: "Earthy red-brown mud wall or textured paper",
    technique: "Off-white rice paste mixed with water and gum",
    characteristics: "Iconic triangle human forms, minimal line geometry, earthy ground",
  },
  ikkat: {
    title: "Authentic Resist-Dyed Ikat Weave",
    description:
      "Complex textile craft where warp and weft yarns are tie-dyed prior to weaving on looms, creating soft feathered motif edges and characteristic thread blur.",
    ground: "Handloom cotton or mulberry silk weave",
    technique: "Resist tie-dyeing of bundled yarns before loom weaving",
    characteristics: "Feathered yarn-bled borders, thread misalignment, tactile slubs",
  },
  bandhani: {
    title: "Bandhani / Bandhej Tie-Dye Textile",
    description:
      "Heritage Indian resist-dyeing technique where cloth is tightly plucked and bound with thread into tiny knots before dipping into natural dye baths.",
    ground: "Fine cotton lawn, silk georgette, or muslin",
    technique: "Hand-pinched thread knotting and resist dye bath dipping",
    characteristics: "Resisted white dots with pale centers, dye halos, crinkled texture",
  },
  ajrakh: {
    title: "Ajrakh Block Print",
    description:
      "Intricate 16-stage hand-block printing craft using carved wooden blocks, lime/mud resist, and natural indigo and madder root dyes.",
    ground: "Unbleached cotton cloth",
    technique: "Synchronized dual-sided hand block stamping with resist paste",
    characteristics: "Symmetrical geometry, indigo/madder palette, stamped registration marks",
  },
  handblock: {
    title: "Sanganeri & Bagru Hand Block Print",
    description:
      "Handcrafted wooden block printing from Rajasthan using vegetable dyes to stamp repeating floral butas, paisleys, and jaal lattices.",
    ground: "Cambric cotton or Kota doria fabric",
    technique: "Hand-pressed carved teakwood blocks with natural pigments",
    characteristics: "Block pressure variation, small registration shifts, organic dye absorption",
  },
};

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

const resolveTraditionalArtApiUrl = () => {
  const envBase = getSubscriptionServiceBase();
  return `${envBase}/api/traditional-art`;
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

const traditionalFaqs = [
  {
    question: "What is the Traditional Art & Indian Craft Studio?",
    answer: "RDC Traditional Art Studio transforms modern graphic inputs into authentic Indian traditional folk art and textile craft previews using generative neural craft models.",
  },
  {
    question: "Which Indian craft styles are supported?",
    answer: "Currently supported styles include Madhubani Painting, Warli Tribal Art, Authentic Ikat Weave, Bandhani Tie-Dye, Ajrakh Block Print, and Rajasthan Hand Block Printing.",
  },
  {
    question: "How does source preservation work?",
    answer: "The AI retains your input design's subject layout, silhouette, composition, and key focal elements while translating the rendering style, lines, and textures into authentic traditional craft marks.",
  },
  {
    question: "Are preview outputs suitable for textile production briefs?",
    answer: "Yes! High-resolution PNG outputs can be used directly for artisan production briefs, client presentations, retail collection catalogs, and trend reports.",
  },
];

export default function TraditionalArtStudio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("madhubani");
  const [selectedProvider, setSelectedProvider] = useState<TextToImageProvider>("gemini");
  const [customPrompt, setCustomPrompt] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaderText, setLoaderText] = useState("Translating artwork into traditional craft marks...");
  const [notice, setNotice] = useState<Notice>(null);

  const selectedGuide = useMemo(() => {
    return guideMap[selectedStyle] || guideMap.madhubani;
  }, [selectedStyle]);

  const loadFile = (file: File) => {
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      setNotice({ type: "error", text: "Please upload a PNG, JPG, JPEG, or WEBP image." });
      return;
    }

    if (sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    setSourceFile(file);
    setSourceUrl(URL.createObjectURL(file));
    setResultUrl("");
    setSplitPosition(100);
    setNotice({ type: "success", text: `${file.name} loaded for traditional craft preview.` });
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
    setSplitPosition(50);
    setProgress(0);
    setCustomPrompt("");
    setSelectedStyle("madhubani");
    setSelectedProvider("gemini");
    setNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generatePreview = async () => {
    if (!sourceFile) {
      setNotice({ type: "error", text: "Please upload an artwork image first." });
      return;
    }

    setIsGenerating(true);
    setProgress(8);
    setNotice(null);

    const steps = [
      "Analyzing motif linework and silhouettes...",
      "Simulating traditional natural dye palettes...",
      "Applying artisan craft marks and woven textures...",
      "Polishing traditional craft preview...",
    ];

    let localProgress = 8;
    const interval = window.setInterval(() => {
      localProgress = Math.min(90, localProgress + Math.floor(Math.random() * 10) + 4);
      setProgress(localProgress);
      setLoaderText(steps[Math.min(steps.length - 1, Math.floor((localProgress / 100) * steps.length))]);
    }, 500);

    try {
      const formData = new FormData();
      formData.append("image", sourceFile);
      formData.append("style", selectedStyle);
      formData.append("provider", selectedProvider);
      if (customPrompt.trim()) formData.append("custom_prompt", customPrompt.trim());

      const token = getToken() || localStorage.getItem("token") || "";
      const response = await fetch(resolveTraditionalArtApiUrl(), {
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
        throw new Error(payload?.detail || payload?.message || `Traditional art preview failed (${response.status})`);
      }

      const imageUrl = payload?.image_url || payload?.url || payload?.result_url;
      if (!imageUrl) {
        throw new Error("No craft preview image was returned from the server.");
      }

      setResultUrl(`${getResponseImageUrl(imageUrl)}${String(imageUrl).includes("?") ? "&" : "?"}t=${Date.now()}`);
      setSplitPosition(50);
      setProgress(100);
      const providerFallbackUsed = Boolean(payload?.provider_fallback_used || payload?.providerFallbackUsed);
      const usedProvider = getModelProviderLabel(payload?.provider || selectedProvider);
      const requestedProvider = getModelProviderLabel(payload?.requested_provider || selectedProvider);
      setNotice({
        type: "success",
        text: providerFallbackUsed
          ? `Craft preview generated with ${usedProvider} fallback after ${requestedProvider} failed.`
          : `Craft preview generated with ${usedProvider}.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Traditional art preview failed.",
      });
    } finally {
      window.clearInterval(interval);
      setIsGenerating(false);
      setLoaderText("Translating artwork into traditional craft marks...");
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    void (async () => {
      const filename = `${selectedStyle}_craft_preview.png`;

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
        <header className="relative rounded-3xl bg-gradient-to-r from-[#1D1714] via-[#1A181D] to-[#1E121B] border border-[#2B3138] p-6 md:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-semibold uppercase tracking-wider mb-3">
                <Palette className="w-3.5 h-3.5" /> Traditional Art & Indian Craft Studio
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Traditional Art & Textile Craft Studio
              </h1>
              <p className="text-[#A1A8B3] text-sm md:text-base mt-1 max-w-2xl">
                Convert graphic designs into authentic Indian traditional craft styles including Madhubani Folk Art, Warli Tribal Art, Ikat Weaves, Bandhani Tie-Dye, Ajrakh, and Hand Block Prints.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <AiCreditCost cost={TRADITIONAL_ART_CREDIT_COST} className="bg-[#1C2025]/80 border-[#2B3138]" />
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
            {/* Step 1: Upload Source Image */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageUp className="w-4 h-4 text-[#F59E0B]" /> 1. Upload Design Artwork
              </h2>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  sourceUrl
                    ? "border-[#10B981]/50 bg-[#10B981]/5"
                    : "border-[#2B3138] hover:border-[#F59E0B]/50 bg-[#1C2025]/50"
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
                      {sourceFile?.name || "Artwork Loaded"} (Click or drag to change)
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

            {/* Step 2: Select Traditional Craft Style */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#F59E0B]" /> 2. Select Craft Style
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {craftOptions.map((option) => {
                  const active = selectedStyle === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStyle(option.value)}
                      className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden ${
                        active
                          ? "bg-[#F59E0B]/10 border-[#F59E0B] shadow-lg shadow-[#F59E0B]/10"
                          : "bg-[#1C2025] border-[#2B3138] hover:border-[#3B424A] hover:bg-[#20242A]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{option.title}</span>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded text-white/90"
                          style={{ backgroundColor: `${option.accent}33` }}
                        >
                          {option.code}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#A1A8B3] line-clamp-2 leading-relaxed">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Provider & Custom Prompt */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" /> 3. Advanced Parameters
              </h2>

              {/* Provider Selection */}
              <div>
                <label className="text-xs font-semibold text-[#A1A8B3] mb-2 block">AI Engine Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["gemini", "openai"] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setSelectedProvider(prov)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        selectedProvider === prov
                          ? "bg-[#F59E0B] border-[#F59E0B] text-black font-bold"
                          : "bg-[#1C2025] border-[#2B3138] text-[#A1A8B3] hover:text-white hover:bg-[#20242A]"
                      }`}
                    >
                      {prov === "gemini" ? "Google Gemini" : "OpenAI GPT"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Direction Textarea */}
              <div>
                <label className="text-xs font-semibold text-[#A1A8B3] mb-2 block">
                  Custom Craft Directions (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Deep vermilion red ground with saffron yellow highlights, fine double line hatching..."
                  rows={3}
                  className="w-full bg-[#1C2025] border border-[#2B3138] rounded-xl p-3 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] transition-colors resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generatePreview}
                disabled={isGenerating || !sourceFile}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isGenerating || !sourceFile
                    ? "bg-[#20242A] text-[#6B7280] border border-[#2B3138] cursor-not-allowed"
                    : "bg-[#F59E0B] hover:bg-[#FFB020] text-black font-extrabold shadow-[#F59E0B]/25 hover:scale-[1.01]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" /> {loaderText}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Generate Craft Preview ({TRADITIONAL_ART_CREDIT_COST} Credits)
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="space-y-1.5 pt-2">
                  <div className="w-full bg-[#1C2025] h-2 rounded-full overflow-hidden border border-[#2B3138]">
                    <div
                      className="bg-gradient-to-r from-[#F59E0B] to-[#FFB020] h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#A1A8B3] text-center font-mono">{progress}% Complete</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview Canvas & Craft Specs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Split Comparison Canvas */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg min-h-[480px] flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#F59E0B]" /> Preview Canvas
                </h2>
                {resultUrl && (
                  <button
                    onClick={downloadResult}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs font-semibold text-[#F59E0B] hover:bg-[#F59E0B] hover:text-black transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PNG
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
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* After Craft Image (Clipped) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${splitPosition}%` }}
                    >
                      <img
                        src={resultUrl}
                        alt="Craft result"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>

                    {/* Split Line handle */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#F59E0B] cursor-ew-resize z-20"
                      style={{ left: `${splitPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#F59E0B] text-black flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold">
                        ↔
                      </div>
                    </div>

                    {/* Badges */}
                    <span className="absolute bottom-3 left-3 bg-[#111317]/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-white border border-[#2B3138]">
                      CRAFT PREVIEW
                    </span>
                    <span className="absolute bottom-3 right-3 bg-[#111317]/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-[#A1A8B3] border border-[#2B3138]">
                      ORIGINAL
                    </span>
                  </div>
                ) : sourceUrl ? (
                  <div className="relative w-full h-full min-h-[380px] flex items-center justify-center p-4">
                    <img
                      src={sourceUrl}
                      alt="Uploaded artwork"
                      className="max-h-[360px] object-contain rounded-lg shadow-lg border border-[#2B3138]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111317] via-transparent to-transparent flex items-end justify-center pb-6">
                      <p className="text-xs text-[#A1A8B3] font-medium bg-[#181B1F]/90 px-4 py-2 rounded-xl border border-[#2B3138]">
                        Select a craft style and click "Generate Craft Preview"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <Palette className="w-12 h-12 text-[#2B3138] mx-auto" />
                    <p className="text-sm font-semibold text-[#A1A8B3]">No Design Artwork Loaded</p>
                    <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                      Upload an artwork or pattern on the left panel to begin traditional craft simulation.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Craft Specs */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" /> Craft Specifications: {selectedGuide.title}
              </h3>
              <p className="text-xs text-[#A1A8B3] leading-relaxed">{selectedGuide.description}</p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                  <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Traditional Ground</p>
                  <p className="text-xs text-white font-medium">{selectedGuide.ground}</p>
                </div>
                <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                  <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Technique & Application</p>
                  <p className="text-xs text-white font-medium">{selectedGuide.technique}</p>
                </div>
                <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                  <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Key Visual Traits</p>
                  <p className="text-xs text-white font-medium">{selectedGuide.characteristics}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <section className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-6 md:p-8 space-y-6 shadow-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#F59E0B]" /> Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {traditionalFaqs.map((faq, index) => (
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
