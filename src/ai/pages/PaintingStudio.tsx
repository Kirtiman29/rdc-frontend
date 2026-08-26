import { useMemo, useRef, useState } from "react";
import { getToken } from "@/api/apiClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  ImageUp,
  Loader2,
  Paintbrush,
  RefreshCcw,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import AiCreditCost from "@/ai/components/AiCreditCost";
import { getModelProviderLabel } from "@/ai/constants/modelProviders";
import type { TextToImageProvider } from "@/api/aiApi";

const PAINTING_PREVIEW_CREDIT_COST = 10;

type TechniqueOption = {
  value: string;
  title: string;
  code: string;
  description: string;
  medium: string;
  accent: string;
  badge: string;
};

type TechniqueGuide = {
  title: string;
  description: string;
  surface: string;
  brushwork: string;
  characteristics: string;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
} | null;

const paintingTechniques: TechniqueOption[] = [
  {
    value: "oil",
    title: "Oil Painting",
    code: "OIL",
    description: "Rich color depth, soft wet-on-wet blending, and impasto highlight ridges on canvas.",
    medium: "Oil on Linen Canvas",
    accent: "#E11D2E",
    badge: "Classic",
  },
  {
    value: "watercolor",
    title: "Liquid Watercolor",
    code: "WTR",
    description: "Transparent wash layers, soft paper blooms, dry-brush streaks, and watery gradients.",
    medium: "Wet Watercolor on Cold-Press Paper",
    accent: "#3B82F6",
    badge: "Expressive",
  },
  {
    value: "acrylic",
    title: "High-Quality Acrylic",
    code: "ACR",
    description: "Thick opaque paint, palette-knife scraped trails, raised ridges, and rich color mixing.",
    medium: "Acrylic on Canvas Panel",
    accent: "#F97316",
    badge: "Modern",
  },
  {
    value: "gouache",
    title: "Balanced Gouache",
    code: "GOU",
    description: "Solid velvety matte color blocks with subtle hand-mixed patches and paper tooth.",
    medium: "Opaque Gouache on Art Paper",
    accent: "#14B8A6",
    badge: "Illustrative",
  },
  {
    value: "fresco",
    title: "Traditional Fresco",
    code: "FRS",
    description: "Chalky mineral pigments absorbed into wet lime plaster with fine aged wall cracks.",
    medium: "Mineral Pigment on Plaster Wall",
    accent: "#F59E0B",
    badge: "Historic",
  },
  {
    value: "encaustic",
    title: "Encaustic Hot Wax",
    code: "ENC",
    description: "Translucent beeswax layers, cloudy depth, melted edges, and heat-fused material flow.",
    medium: "Pigmented Beeswax on Wood Panel",
    accent: "#A855F7",
    badge: "Sculptural",
  },
  {
    value: "charcoal",
    title: "Colored Charcoal",
    code: "CHR",
    description: "Hand-drawn powdery charcoal strokes, smudged shading, and erased highlights.",
    medium: "Tinted Charcoal on Textured Paper",
    accent: "#64748B",
    badge: "Handcrafted",
  },
  {
    value: "dry-brush",
    title: "Dry Brush Painting",
    code: "DRY",
    description: "Dragged low-moisture pigment, bristle streaks, skipped paint, and scratchy edges.",
    medium: "Dry Paint on Rough Cloth",
    accent: "#EC4899",
    badge: "Textural",
  },
];

const guideMap: Record<string, TechniqueGuide> = {
  oil: {
    title: "Oil Painting Technique",
    description:
      "Simulates layered slow-drying oil paint with realistic directional brushstrokes, luminous shadow glazing, and raised impasto ridges on highlights.",
    surface: "Heavy stretched linen canvas with subtle weave tooth",
    brushwork: "Directional bristle work following form contours",
    characteristics: "Deep color saturation, soft wet blending, glossy highlights",
  },
  watercolor: {
    title: "Loose Liquid Watercolor",
    description:
      "Renders artwork as fluid pigment blooming on wet paper, capturing translucent wash overlaps, backrun cauliflower marks, and paper grain.",
    surface: "Heavyweight 300gsm cold-press cotton paper",
    brushwork: "Loose expressive sweeps with dry-brush accent streaks",
    characteristics: "Transparent color pooling, soft feathered edges, paper tooth",
  },
  acrylic: {
    title: "Impasto Acrylic",
    description:
      "Re-creates thick acrylic paint applied with brushes and palette knives, featuring raised paint buildup, color mixing inside shapes, and scumbled layers.",
    surface: "Primed canvas or rigid wood panel",
    brushwork: "Varied knife scrapes, thick impasto strokes, liner-brush marks",
    characteristics: "Vibrant opacity, raised physical texture, satin sheen",
  },
  gouache: {
    title: "Designer Gouache",
    description:
      "Transforms images into velvety, opaque gouache illustrations with solid matte color fields, brush overlap variations, and clean contours.",
    surface: "Smooth fine art illustration board",
    brushwork: "Controlled flat brush fields with slight opacity shifts",
    characteristics: "Velvety chalk-matte finish, opaque coverage, hand-painted edge softness",
  },
  fresco: {
    title: "Buon Fresco Mural",
    description:
      "Simulates ancient fresco wall paintings where earthy mineral pigments soak directly into wet lime plaster, featuring weathered patina and hairline cracks.",
    surface: "Aged lime plaster wall with subtle trowel grain",
    brushwork: "Broad absorbed washes and mineral pigment shading",
    characteristics: "Matte chalky surface, muted earthy palette, fine plaster fissures",
  },
  encaustic: {
    title: "Encaustic Wax Art",
    description:
      "Employs colored beeswax fused with heat to build cloudy, semi-transparent layers, carved lines, and glowing dimensional depth.",
    surface: "Cradled birch wood panel",
    brushwork: "Heat-fused wax flows, scraped channels, and melted boundaries",
    characteristics: "Translucent wax luminescence, satin wax sheen, tactile relief",
  },
  charcoal: {
    title: "Colored Charcoal Drawing",
    description:
      "Converts artwork into hand-rendered colored charcoal drawings with powdery grain, smudged tonal shading, and lifted eraser highlights.",
    surface: "Heavy tooth drawing paper",
    brushwork: "Expressive charcoal stick strokes, finger blending, hatching",
    characteristics: "Powdery grain texture, soft smudged gradients, paper tooth catching",
  },
  "dry-brush": {
    title: "Dry Brush Repainting",
    description:
      "Repaints motifs with a low-moisture brush dragged across textured ground, creating bristle drag streaks and skipped pigment gaps.",
    surface: "Textured paper or raw canvas ground",
    brushwork: "Dragged bristle strokes with internal paint breaks",
    characteristics: "Broken coverage, scratchy stroke edges, exposed raw surface tooth",
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

const resolvePaintingApiUrl = () => {
  const envBase = getSubscriptionServiceBase();
  return `${envBase}/api/painting-technique`;
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

const paintingFaqs = [
  {
    question: "What is the Brush Effect / Painting Technique Studio?",
    answer: "RDC Painting Technique Studio transforms digital vector graphics, patterns, or photo inputs into realistic physical painting mediums using advanced neural image synthesis.",
  },
  {
    question: "Which painting styles are available?",
    answer: "You can select from 8 distinct artistic mediums: Oil Painting, Liquid Watercolor, Impasto Acrylic, Opaque Gouache, Traditional Fresco, Encaustic Hot Wax, Colored Charcoal, and Dry Brush.",
  },
  {
    question: "How do custom prompts work?",
    answer: "You can add specific artistic instructions in the custom direction box, such as specifying color palette adjustments, brush stroke thickness, canvas tooth intensity, or highlight focal areas.",
  },
  {
    question: "Are the generated painted previews suitable for commercial print & digital catalogs?",
    answer: "Yes! The output is rendered as high-resolution PNG artwork suitable for textile collection briefs, lookbooks, client mockups, and retail marketing.",
  },
];

export default function PaintingStudio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState("watercolor");
  const [selectedProvider, setSelectedProvider] = useState<TextToImageProvider>("gemini");
  const [customPrompt, setCustomPrompt] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaderText, setLoaderText] = useState("Preparing canvas and paint palette...");
  const [notice, setNotice] = useState<Notice>(null);

  const selectedGuide = useMemo(() => {
    return guideMap[selectedTechnique] || guideMap.oil;
  }, [selectedTechnique]);

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
    setNotice({ type: "success", text: `${file.name} loaded for painting technique transformation.` });
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
    setSelectedTechnique("watercolor");
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
      "Layering paint pigments and paper tooth...",
      "Applying directional brushstrokes...",
      "Simulating wet-on-wet color blending...",
      "Polishing painting preview...",
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
      formData.append("technique", selectedTechnique);
      formData.append("provider", selectedProvider);
      if (customPrompt.trim()) formData.append("custom_prompt", customPrompt.trim());

      const token = getToken() || localStorage.getItem("token") || "";
      const response = await fetch(resolvePaintingApiUrl(), {
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
        throw new Error(payload?.detail || payload?.message || `Painting technique preview failed (${response.status})`);
      }

      const imageUrl = payload?.image_url || payload?.url || payload?.result_url;
      if (!imageUrl) {
        throw new Error("No painted image preview was returned from the server.");
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
          ? `Painting preview generated with ${usedProvider} fallback after ${requestedProvider} failed.`
          : `Painting preview generated with ${usedProvider}.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Painting preview failed.",
      });
    } finally {
      window.clearInterval(interval);
      setIsGenerating(false);
      setLoaderText("Preparing canvas and paint palette...");
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    void (async () => {
      const filename = `${selectedTechnique}_painting_preview.png`;

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
        <header className="relative rounded-3xl bg-gradient-to-r from-[#1A1D24] via-[#16181D] to-[#1F171B] border border-[#2B3138] p-6 md:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E11D2E]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D2E]/15 border border-[#E11D2E]/30 text-[#E11D2E] text-xs font-semibold uppercase tracking-wider mb-3">
                <Paintbrush className="w-3.5 h-3.5" /> Brush Effect & Painting Studio
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Painting Technique Studio
              </h1>
              <p className="text-[#A1A8B3] text-sm md:text-base mt-1 max-w-2xl">
                Transform any digital design or artwork into physically convincing oil paintings, liquid watercolors, impasto acrylics, gouache, frescos, and dry-brush repaintings.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <AiCreditCost cost={PAINTING_PREVIEW_CREDIT_COST} className="bg-[#1C2025]/80 border-[#2B3138]" />
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
          {/* Left Panel - Controls & Technique Selection */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Upload Source Image */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageUp className="w-4 h-4 text-[#E11D2E]" /> 1. Upload Design Artwork
              </h2>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  sourceUrl
                    ? "border-[#10B981]/50 bg-[#10B981]/5"
                    : "border-[#2B3138] hover:border-[#E11D2E]/50 bg-[#1C2025]/50"
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

            {/* Step 2: Choose Painting Technique */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-[#E11D2E]" /> 2. Select Painting Medium
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {paintingTechniques.map((option) => {
                  const active = selectedTechnique === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedTechnique(option.value)}
                      className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden ${
                        active
                          ? "bg-[#E11D2E]/10 border-[#E11D2E] shadow-lg shadow-[#E11D2E]/10"
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
                <Sparkles className="w-4 h-4 text-[#E11D2E]" /> 3. Advanced Parameters
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
                          ? "bg-[#E11D2E] border-[#E11D2E] text-white"
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
                  Custom Artistic Directions (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Heavy palette knife texture on rose petals, soft wet-on-wet wash in background, warm ochre tones..."
                  rows={3}
                  className="w-full bg-[#1C2025] border border-[#2B3138] rounded-xl p-3 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#E11D2E] transition-colors resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generatePreview}
                disabled={isGenerating || !sourceFile}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isGenerating || !sourceFile
                    ? "bg-[#20242A] text-[#6B7280] border border-[#2B3138] cursor-not-allowed"
                    : "bg-[#E11D2E] hover:bg-[#FF3347] text-white shadow-[#E11D2E]/25 hover:scale-[1.01]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {loaderText}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Generate Painting Preview ({PAINTING_PREVIEW_CREDIT_COST} Credits)
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="space-y-1.5 pt-2">
                  <div className="w-full bg-[#1C2025] h-2 rounded-full overflow-hidden border border-[#2B3138]">
                    <div
                      className="bg-gradient-to-r from-[#E11D2E] to-[#FF5263] h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#A1A8B3] text-center font-mono">{progress}% Complete</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Interactive Preview Canvas & Material Guide */}
          <div className="lg:col-span-7 space-y-6">
            {/* Split Comparison Canvas */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg min-h-[480px] flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-[#E11D2E]" /> Preview Canvas
                </h2>
                {resultUrl && (
                  <button
                    onClick={downloadResult}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E11D2E]/10 border border-[#E11D2E]/30 text-xs font-semibold text-[#E11D2E] hover:bg-[#E11D2E] hover:text-white transition-all"
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

                    {/* After Painted Image (Clipped) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${splitPosition}%` }}
                    >
                      <img
                        src={resultUrl}
                        alt="Painted result"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>

                    {/* Split Line handle */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#E11D2E] cursor-ew-resize z-20"
                      style={{ left: `${splitPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#E11D2E] text-white flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold">
                        ↔
                      </div>
                    </div>

                    {/* Badges */}
                    <span className="absolute bottom-3 left-3 bg-[#111317]/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-white border border-[#2B3138]">
                      PAINTED PREVIEW
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
                        Select a painting technique and click "Generate Painting Preview"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <Paintbrush className="w-12 h-12 text-[#2B3138] mx-auto" />
                    <p className="text-sm font-semibold text-[#A1A8B3]">No Design Artwork Loaded</p>
                    <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                      Upload an artwork or pattern on the left panel to begin painting technique simulation.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Material & Technique Specifications Guide */}
            <div className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-5 space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E11D2E]" /> Medium Specifications: {selectedGuide.title}
              </h3>
              <p className="text-xs text-[#A1A8B3] leading-relaxed">{selectedGuide.description}</p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                  <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Canvas / Ground</p>
                  <p className="text-xs text-white font-medium">{selectedGuide.surface}</p>
                </div>
                <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                  <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Brushwork & Application</p>
                  <p className="text-xs text-white font-medium">{selectedGuide.brushwork}</p>
                </div>
                <div className="bg-[#1C2025] p-3 rounded-xl border border-[#2B3138]">
                  <p className="text-[10px] text-[#6B7280] font-bold uppercase mb-1">Key Characteristics</p>
                  <p className="text-xs text-white font-medium">{selectedGuide.characteristics}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <section className="bg-[#181B1F] border border-[#2B3138] rounded-2xl p-6 md:p-8 space-y-6 shadow-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-[#E11D2E]" /> Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {paintingFaqs.map((faq, index) => (
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
