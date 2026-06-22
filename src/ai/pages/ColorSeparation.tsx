import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  Eye,
  ImageUp,
  Info,
  Layers3,
  LoaderCircle,
  Palette,
  ScanSearch,
  Settings,
  Sparkles,
  Upload,
  XCircle,
  ChevronRight,
  Zap,
  Clock,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";

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
import {
  COLOR_SEPARATION_TIMEOUT_SECONDS,
  ColorSeparationLayer,
  ColorSeparationResult,
  downloadAsset,
  downloadImage,
  getColorSeparationErrorMessage,
  getFullImageUrl,
  separateColors,
} from "@/api/colorSeparationApi";
import AiCreditCost from "@/ai/components/AiCreditCost";

type RequestMeta = {
  mode: string;
  numColors: number | "";
} | null;

type Step = 'upload' | 'configure' | 'generate' | 'export';
type ImageMetadata = { width: number; height: number; size: string };

const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const SUPPORTED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"];
const COLOR_SEPARATION_CREDIT_COST = 4;

const isSupportedImageFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return (
    SUPPORTED_IMAGE_TYPES.includes(file.type) ||
    SUPPORTED_IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension))
  );
};

function Stepper({ currentStep, completedSteps }: { currentStep: Step; completedSteps: Step[] }) {
  const steps = [
    { id: 'upload' as Step, label: 'Upload Artwork', icon: ImageUp },
    { id: 'configure' as Step, label: 'Configure Logic', icon: Settings },
    { id: 'generate' as Step, label: 'Generate Layers', icon: Zap },
    { id: 'export' as Step, label: 'Preview & Export', icon: Download },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isActive = isCurrent || isCompleted;

        return (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
              isActive ? 'border-[#E11D2E]/20 bg-[#E11D2E]/10' : 'border-white/10 bg-white/5'
            }`}>
              <div className={`p-2 rounded-full ${
                isCompleted ? 'bg-green-500/20 text-green-400' :
                isCurrent ? 'bg-[#E11D2E]/20 text-[#E11D2E]' :
                'bg-white/10 text-gray-500'
              }`}>
                {isCompleted ? <CheckCircle2 size={16} /> : <step.icon size={16} />}
              </div>
              <span className={`text-xs font-bold ${
                isActive ? 'text-white' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className={`hidden transition-colors sm:block ${
                completedSteps.includes(steps[index + 1].id) ? 'text-[#E11D2E]' : 'text-gray-600'
              }`} size={20} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PanelHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E11D2E]/20 bg-[#E11D2E]/10 text-[#E11D2E]">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black uppercase tracking-tight text-white">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function HeroHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#2B3138]/60 pb-6 mt-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2B3138] bg-[#1C2025] px-3 py-1 text-xs font-semibold text-[#A1A8B3]">
          <Sparkles className="h-3.5 w-3.5 text-[#E11D2E]" />
          RDC AI Studio
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
          Color Separation: Layer Stack Generator
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="grid grid-cols-2 gap-4 text-right">
          <HeaderMetric label="Output" value="PNG Layers" />
          <HeaderMetric label="Export" value="PSD Ready" />
        </div>
        <Link
          to="/ai-studio"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2B3138] bg-[#20242A] px-5 text-sm font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31] self-start sm:self-auto"
        >
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function UploadPreviewCard({
  file,
  previewUrl,
  dragActive,
  loading,
  imageMetadata,
  onFileChange,
  onDragStateChange,
  onRemove,
  isCollapsed,
  onExpand,
}: {
  file: File | null;
  previewUrl: string;
  dragActive: boolean;
  loading: boolean;
  imageMetadata: ImageMetadata | null;
  onFileChange: (file?: File) => void;
  onDragStateChange: (active: boolean) => void;
  onRemove: () => void;
  isCollapsed: boolean;
  onExpand: () => void;
}) {
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onDragStateChange(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onFileChange(droppedFile);
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur w-full max-w-[440px] flex flex-col justify-between">
      <div>
        <PanelHeading
          icon={<ImageUp size={18} />}
          title="Source Artwork"
          description="Upload a single artwork file for transparent layer extraction."
        />

        <label
          className={`mt-6 flex cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed transition-colors ${
            dragActive
              ? "border-[#E11D2E] bg-[#E11D2E]/10 shadow-lg shadow-[#E11D2E]/20"
              : "border-white/10 bg-black/30 hover:border-[#E11D2E]/40 hover:bg-white/[0.03] hover:shadow-md"
          } w-full aspect-square relative`}
          onDragEnter={(event) => {
            event.preventDefault();
            onDragStateChange(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            onDragStateChange(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            onDragStateChange(false);
          }}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            hidden
            onChange={(event) => onFileChange(event.target.files?.[0])}
            disabled={loading}
          />

          {!previewUrl ? (
            <div className="text-center p-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
                <Upload size={24} />
              </div>
              <h4 className="text-sm font-bold text-white">Drop artwork here or browse</h4>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">PNG, JPG, JPEG supported</p>
            </div>
          ) : (
            <div className="absolute inset-0 h-full w-full flex items-center justify-center overflow-hidden">
              <img
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-110"
                src={previewUrl}
                alt={file?.name ?? "Uploaded artwork"}
              />
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/0 opacity-0 transition-all duration-300 hover:bg-black/50 hover:opacity-100 gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onRemove(); }}
                  className="px-3 py-1.5 bg-[#E11D2E] text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors transform scale-90 hover:scale-100 duration-300 shadow-md"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
                  }}
                  className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors border border-white/10 transform scale-90 hover:scale-100 duration-300 shadow-md"
                >
                  Replace
                </button>
              </div>
            </div>
          )}
        </label>
      </div>

      <div className="mt-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetaTile label="Selected File" value={file?.name ?? "No image selected"} />
          <MetaTile label="Mode" value={previewUrl ? "Ready" : "Awaiting upload"} />
        </div>

        {imageMetadata && (
          <div className="grid gap-3 sm:grid-cols-3">
            <MetaTile label="Width" value={`${imageMetadata.width}px`} />
            <MetaTile label="Height" value={`${imageMetadata.height}px`} />
            <MetaTile label="Size" value={imageMetadata.size} />
          </div>
        )}
      </div>
    </section>
  );
}


function MetaTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-4 transition-colors hover:bg-white/[0.06]">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">{label}</span>
      <strong className="mt-1 block truncate text-xs text-white/80">{value}</strong>
    </div>
  );
}

function AssuranceChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function ControlPanel({
  mode,
  numColors,
  loading,
  loadingSeconds,
  imageMetadata,
  hasFile,
  hasResults,
  onModeChange,
  onNumColorsChange,
  onSubmit,
  onDownloadAll,
  isCollapsed,
  onExpand,
}: {
  mode: string;
  numColors: string;
  loading: boolean;
  loadingSeconds: number;
  imageMetadata: ImageMetadata | null;
  hasFile: boolean;
  hasResults: boolean;
  onModeChange: (mode: string) => void;
  onNumColorsChange: (value: string) => void;
  onSubmit: () => void;
  onDownloadAll: () => void;
  isCollapsed: boolean;
  onExpand: () => void;
}) {
  // AI suggestions based on image complexity (mock for now)
  const suggestedColors = imageMetadata ? Math.min(Math.max(Math.floor((imageMetadata.width * imageMetadata.height) / 100000) + 2, 3), 8) : 5;
  const estimatedTime = mode === 'auto' ? '15-30s' : '5-15s';
  const loadingProgressPercent = Math.min(
    95,
    (loadingSeconds / COLOR_SEPARATION_TIMEOUT_SECONDS) * 100
  );

  if (isCollapsed) {
    return (
      <section className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-colors hover:bg-white/[0.05]" onClick={onExpand}>
        <div className="flex items-center justify-between">
          <PanelHeading
            icon={<Settings size={18} />}
            title="Configure Logic"
            description="Configuration set successfully"
          />
          <CheckCircle2 className="text-green-400" size={24} />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <PanelHeading
          icon={<ScanSearch size={18} />}
          title="Process Mode"
          description="Choose automatic color detection or specify the count manually."
        />

        <div className="mt-6 grid grid-cols-2 gap-3">
          {["auto", "manual"].map((value) => (
            <button
              key={value}
              type="button"
              className={`rounded-2xl border p-4 text-left transition-colors ${
                mode === value
                  ? "border-[#E11D2E]/40 bg-[#E11D2E]/10"
                  : "border-white/5 bg-black/30 opacity-70 hover:opacity-100"
              }`}
              onClick={() => onModeChange(value)}
            >
              <strong className="block text-xs font-black uppercase text-white">
                {value === "auto" ? "Auto Detect" : "Manual"}
              </strong>
              <span className="mt-2 block text-[11px] leading-relaxed text-gray-500">
                {value === "auto"
                  ? "AI identifies the optimal palette automatically."
                  : "Define exact number of target colors."}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <PanelHeading icon={<Palette size={18} />} title="Number of Colors" description="AI suggests optimal count based on image complexity." />

        {mode === 'auto' && (
          <div className="mt-4 p-3 bg-[#E11D2E]/10 border border-[#E11D2E]/20 rounded-xl">
            <div className="flex items-center gap-2 text-[#E11D2E]">
              <Zap size={16} />
              <span className="text-xs font-bold">AI Suggestion: {suggestedColors} colors</span>
            </div>
            <p className="text-xs text-gray-300 mt-1">Based on image resolution and complexity</p>
          </div>
        )}

        <label className="mt-6 block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Target Layer Count
          </span>
          <input
            type="number"
            min="2"
            max="20"
            value={numColors}
            onChange={(event) => onNumColorsChange(event.target.value)}
            placeholder={mode === 'auto' ? `Suggested: ${suggestedColors}` : "Enter count"}
            disabled={mode !== "manual" || loading}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-700 focus:border-[#E11D2E]/50 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>
        <p className="mt-3 text-xs leading-relaxed text-gray-600">
          Manual mode enables this field. Auto Detect uses AI optimization.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <PanelHeading icon={<Layers3 size={18} />} title="Processing Info" description="AI-powered analysis with quality predictions." />

        <div className="mt-6 grid gap-3">
          <MetaTile label="Output Format" value="Transparent PNG" />
          <MetaTile label="AI Engine" value="Precision Textile" />
          <MetaTile label="Quality Mode" value={mode === 'auto' ? 'Optimized' : 'Custom'} />
          <MetaTile label="Est. Time" value={estimatedTime} />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <Clock size={14} />
          <span>{mode === 'auto' ? 'Slower but optimal results' : 'Faster with custom control'}</span>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <div className="mb-5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">AI Processing</span>
          <strong className="mt-1 block text-sm text-white">Generate premium reconstructable color layers</strong>
        </div>
        <AiCreditCost
          credits={COLOR_SEPARATION_CREDIT_COST}
          label="Separation Cost"
          className="mb-5 w-fit"
        />
        <button
          type="button"
          className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white transition-colors ${
            loading ? 'bg-gray-700' : 'bg-[#E11D2E] hover:bg-red-700'
          } disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={!hasFile || loading}
          onClick={onSubmit}
        >
          {loading && (
            <div className="absolute inset-y-0 left-0 bg-[#E11D2E]" style={{ width: `${loadingProgressPercent}%` }} />
          )}
          {loading ? <LoaderCircle size={18} className="animate-spin relative z-10" /> : <Zap size={18} className="relative z-10" />}
          <span className="relative z-10">
            {loading ? `Processing... ${loadingSeconds}s` : "Generate Layers"}
          </span>
        </button>

        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold uppercase tracking-widest text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          disabled={!hasResults || loading}
          onClick={onDownloadAll}
        >
          <Download size={18} />
          <span>Download All Layers</span>
        </button>

        <p className="mt-4 text-xs leading-relaxed text-gray-600">
          {mode === "manual"
            ? "Manual mode provides precise control over color extraction."
            : "Auto Detect leverages AI for optimal color separation results."}
        </p>
      </div>
    </section>
  );
}

function StatusBanner({
  error,
  result,
  loading,
  loadingSeconds = 0,
  requestMeta,
  onCancel,
  timeoutSeconds = COLOR_SEPARATION_TIMEOUT_SECONDS,
}: {
  error: string;
  result: ColorSeparationResult | null;
  loading: boolean;
  loadingSeconds?: number;
  requestMeta: RequestMeta;
  onCancel?: () => void;
  timeoutSeconds?: number;
}) {
  const generatedCount = result?.layers?.length ?? result?.num_colors ?? 0;

  if (loading) {
    const isLongRunning = loadingSeconds >= 10;
    const isVeryLongRunning = loadingSeconds >= 25;
    const isManualMode = requestMeta?.mode === "manual";
    const modeHint = isManualMode
      ? "Manual mode skips the auto-detect search, so long waits here usually mean the backend is busy."
      : "Auto Detect is slower because the backend tries several color counts before exporting the final layers.";
    const timeoutHint = isVeryLongRunning
      ? ` If it keeps spinning close to ${timeoutSeconds}s, the backend may be overloaded or not responding.`
      : "";

    return (
      <StatusShell tone="loading" icon={<LoaderCircle size={18} className="animate-spin" />}>
        <strong>Generating transparent reconstructable layers</strong>
        <p>
          {isLongRunning
            ? `Artwork is still processing. ${modeHint} Elapsed: ${loadingSeconds}s.${timeoutHint}`
            : "Uploading the artwork and waiting for the backend to finish the color separation job."}
        </p>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white/15"
          >
            <XCircle size={15} />
            Cancel Generation
          </button>
        ) : null}
      </StatusShell>
    );
  }

  if (error) {
    return (
      <StatusShell tone="error" icon={<XCircle size={18} />}>
        <strong>Layer generation failed</strong>
        <p>{error}</p>
      </StatusShell>
    );
  }

  if (result) {
    return (
      <StatusShell tone="success" icon={<CheckCircle2 size={18} />}>
        <strong>Separation complete</strong>
        <p>
          {generatedCount} layers generated with reconstructable output{" "}
          {result.reconstructable ? "enabled" : "unavailable"}.
        </p>
      </StatusShell>
    );
  }

  return (
    <StatusShell tone="idle" icon={<Settings size={18} />}>
      <strong>Awaiting artwork upload</strong>
      <p>Select a file to unlock the generation controls and studio output.</p>
    </StatusShell>
  );
}

function StatusShell({
  tone,
  icon,
  children,
}: {
  tone: "loading" | "error" | "success" | "idle";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const toneClasses = {
    loading: "border-blue-500/20 bg-blue-500/10 text-blue-200",
    error: "border-red-500/20 bg-red-500/10 text-red-200",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    idle: "border-white/10 bg-white/[0.03] text-gray-400",
  };

  return (
    <div className={`flex items-start gap-4 rounded-[24px] border p-5 ${toneClasses[tone]}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="text-sm">
        <div className="[&_strong]:mb-1 [&_strong]:block [&_strong]:text-white [&_p]:text-xs [&_p]:leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function RequestAudit({ requestMeta, result }: { requestMeta: RequestMeta; result: ColorSeparationResult | null }) {
  if (!result || !requestMeta) return null;

  const requestedCount =
    requestMeta.mode === "manual" && requestMeta.numColors
      ? Number(requestMeta.numColors)
      : null;

  const generatedCount = result.layers?.length ?? result.num_colors ?? 0;
  const hasMismatch =
    requestedCount !== null &&
    Number.isFinite(requestedCount) &&
    requestedCount !== generatedCount;

  return (
    <StatusShell tone={hasMismatch ? "error" : "idle"} icon={<Settings size={18} />}>
      <strong>Request Mode: {requestMeta.mode === "manual" ? "Manual" : "Auto Detect"}</strong>
      <p>
        {requestedCount !== null
          ? `Requested ${requestedCount} colors. Backend returned ${generatedCount} layers.`
          : `Submitted without num_colors, so backend used auto detection and returned ${generatedCount} layers.`}
      </p>
    </StatusShell>
  );
}

function LayerCard({
  layer,
  onDownloadLayer,
  onPreviewLayer,
}: {
  layer: ColorSeparationLayer;
  onDownloadLayer: (layer: ColorSeparationLayer) => void;
  onPreviewLayer: (layer: ColorSeparationLayer) => void;
}) {
  const originalUrl = getFullImageUrl(layer.layer_path);

  return (
    <article className="rounded-[24px] border border-white/10 bg-black/30 p-4 transition-colors hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-white">{layer.layer_name}</h4>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Layer {layer.layer_index}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-[linear-gradient(45deg,rgba(255,255,255,.08)_25%,transparent_25%),linear-gradient(-45deg,rgba(255,255,255,.08)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(255,255,255,.08)_75%),linear-gradient(-45deg,transparent_75%,rgba(255,255,255,.08)_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
          {originalUrl ? (
            <img className="h-full w-full object-contain" src={originalUrl} alt={layer.layer_name} />
          ) : (
            <div className="text-xs text-gray-600">Layer preview unavailable</div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          onClick={() => onPreviewLayer(layer)}
        >
          <Eye size={16} />
          <span>Preview</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          onClick={() => onDownloadLayer(layer)}
        >
          <Download size={16} />
          <span>Download</span>
        </button>
      </div>
    </article>
  );
}

function PhotoshopExportCard({
  result,
  onDownloadPsd,
  onDownloadPackage,
  onDownloadScript,
}: {
  result: ColorSeparationResult | null;
  onDownloadPsd: () => void;
  onDownloadPackage: () => void;
  onDownloadScript: () => void;
}) {
  if (!result?.photoshop_package && !result?.photoshop_script && !result?.photoshop_psd) return null;

  return (
    <div className="rounded-[28px] border border-[#E11D2E]/20 bg-[#E11D2E]/5 p-6 backdrop-blur">
      <PanelHeading
        icon={<Layers3 size={18} />}
        title="Photoshop Export"
        description={
          result.photoshop_psd_ready
            ? "Your layered PSD is ready. Download it directly and open it in Photoshop."
            : "If direct PSD is unavailable, use the package fallback."
        }
      />

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <MetaTile label="PSD Status" value={result.photoshop_psd_ready ? "Ready To Download" : "Generate Via JSX"} />
        <MetaTile label="Package" value={result.photoshop_package ? "Available" : "Unavailable"} />
        <MetaTile label="Script" value={result.photoshop_script ? "Available" : "Unavailable"} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <ExportButton primary disabled={!result.photoshop_psd} onClick={onDownloadPsd}>Download PSD</ExportButton>
        <ExportButton primary disabled={!result.photoshop_package} onClick={onDownloadPackage}>Download Package</ExportButton>
        {!result.photoshop_psd_ready ? (
          <ExportButton disabled={!result.photoshop_script} onClick={onDownloadScript}>Download JSX</ExportButton>
        ) : null}
      </div>
    </div>
  );
}

function ExportButton({
  children,
  disabled,
  onClick,
  primary = false,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  const buttonClassName = primary
    ? "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E11D2E] bg-[#E11D2E] px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40 disabled:opacity-40"
    : "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={buttonClassName}
    >
      <Download size={16} />
      {children}
    </button>
  );
}

function ResultsSection({
  result,
  onDownloadLayer,
  onPreviewLayer,
  onDownloadAll,
  onDownloadPsd,
  onDownloadPackage,
  onDownloadScript,
  onStartNew,
  isCollapsed,
  onExpand,
}: {
  result: ColorSeparationResult | null;
  onDownloadLayer: (layer: ColorSeparationLayer) => void;
  onPreviewLayer: (layer: ColorSeparationLayer) => void;
  onDownloadAll: () => void;
  onDownloadPsd: () => void;
  onDownloadPackage: () => void;
  onDownloadScript: () => void;
  onStartNew: () => void;
  isCollapsed: boolean;
  onExpand: () => void;
}) {
  if (isCollapsed) {
    return (
      <section className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-colors hover:bg-white/[0.05]" onClick={onExpand}>
        <div className="flex items-center justify-between">
          <PanelHeading
            icon={<Download size={18} />}
            title="Preview & Export"
            description="Layers generated successfully"
          />
          <CheckCircle2 className="text-green-400" size={24} />
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
          <Layers3 size={28} />
        </div>
        <h3 className="text-lg font-black text-white">No layers generated yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          Your detected palette, transparent layer previews, and reconstruction summary will appear here after processing.
        </p>
      </section>
    );
  }

  const layers = result.layers ?? [];
  const detectedColors = result.detected_colors ?? [];
  const totalColors = result.num_colors ?? layers.length ?? 0;

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <PanelHeading icon={<Palette size={18} />} title="Detected Palette" description="Detected colors prepared for transparent layer export." />

          <div className="mt-6 flex flex-wrap gap-3">
            {detectedColors.length ? (
              detectedColors.map((color, index) => (
                <div
                  key={`${color}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-3"
                >
                  <div className="h-8 w-8 rounded-lg border border-white/10" style={{ backgroundColor: color }} />
                  <div>
                    <span className="font-mono text-xs text-white/80 block">{color}</span>
                    <span className="text-[10px] text-gray-500">Detected tone</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-gray-600">
                No detected color values were returned.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <PanelHeading
            icon={<Layers3 size={18} />}
            title="Output Ready"
            description="Download the full layer set or start a fresh artwork."
          />
          <div className="mt-6 grid gap-3">
            <MetaTile label="Layers" value={`${layers.length} Ready`} />
            <MetaTile label="Colors" value={totalColors} />
            <button
              type="button"
              onClick={onDownloadAll}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E11D2E]/70 bg-[#E11D2E] px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!layers.length}
            >
              <Download size={16} />
              Download All Layers
            </button>
            <button
              type="button"
              onClick={onStartNew}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ImageUp size={16} />
              Start New Design
            </button>
          </div>
        </div>
      </div>

      <PhotoshopExportCard
        result={result}
        onDownloadPsd={onDownloadPsd}
        onDownloadPackage={onDownloadPackage}
        onDownloadScript={onDownloadScript}
      />

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <PanelHeading
            icon={<Layers3 size={18} />}
            title="Layer Previews"
            description="Preview individual transparent layers or download them one by one."
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {layers.length ? (
            layers.map((layer) => (
              <LayerCard
                key={layer.layer_index}
                layer={layer}
                onDownloadLayer={onDownloadLayer}
                onPreviewLayer={onPreviewLayer}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-gray-600">
              No layer assets were returned in this response.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewModal({
  layer,
  isOpen,
  onClose,
}: {
  layer: ColorSeparationLayer | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !layer) return null;

  const imageUrl = getFullImageUrl(layer.layer_path);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 p-2 text-white/60 hover:text-white"
        >
          <XCircle size={20} />
        </button>
        <div className="mb-4">
          <h3 className="text-lg font-black text-white">{layer.layer_name}</h3>
          <p className="text-sm text-gray-400">Layer {layer.layer_index}</p>
        </div>
        <div className="flex items-center justify-center">
          {imageUrl ? (
            <img className="max-h-[70vh] max-w-full object-contain" src={imageUrl} alt={layer.layer_name} />
          ) : (
            <div className="text-gray-600">Preview unavailable</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ColorSeparationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mode, setMode] = useState("auto");
  const [numColors, setNumColors] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [result, setResult] = useState<ColorSeparationResult | null>(null);
  const [error, setError] = useState("");
  const [requestMeta, setRequestMeta] = useState<RequestMeta>(null);
  const [previewLayer, setPreviewLayer] = useState<ColorSeparationLayer | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const colorSeparationAbortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

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

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      setImageMetadata(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Load image metadata
    const img = new Image();
    img.onload = () => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setImageMetadata({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: `${sizeInMB} MB`,
      });
    };
    img.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!loading) {
      setLoadingSeconds(0);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setLoadingSeconds((currentValue) => currentValue + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [loading]);

  useEffect(() => {
    return () => colorSeparationAbortRef.current?.abort();
  }, []);

  // Step management
  useEffect(() => {
    if (file && currentStep === 'upload') {
      setCurrentStep('configure');
      setCompletedSteps(['upload']);
    }
  }, [file, currentStep]);

  useEffect(() => {
    if (result && !loading) {
      setCurrentStep('export');
      setCompletedSteps(['upload', 'configure', 'generate']);
    }
  }, [result, loading]);

  const derivedNumColors = useMemo(() => {
    if (mode !== "manual") return "";
    const normalizedValue = numColors.trim();
    if (!normalizedValue) return "";
    return Number(normalizedValue);
  }, [mode, numColors]);

  const handleSubmit = async () => {
    if (!file) return;

    setCurrentStep('generate');
    setCompletedSteps(['upload', 'configure']);

    const requestMode = mode;
    const requestNumColors = derivedNumColors;
    const requestId = requestIdRef.current + 1;
    const abortController = new AbortController();
    requestIdRef.current = requestId;
    colorSeparationAbortRef.current?.abort();
    colorSeparationAbortRef.current = abortController;

    try {
      setLoading(true);
      setLoadingSeconds(0);
      setError("");
      setResult(null);
      setRequestMeta({
        mode: requestMode,
        numColors: requestNumColors,
      });

      const response = await separateColors(file, requestNumColors, {
        signal: abortController.signal,
      });

      if (requestIdRef.current === requestId) {
        setResult(response);
      }
    } catch (requestError) {
      if (requestIdRef.current === requestId) {
        setError(getColorSeparationErrorMessage(requestError));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        colorSeparationAbortRef.current = null;
      }
    }
  };

  const handleDownloadLayer = async (layer: ColorSeparationLayer) => {
    await downloadImage(layer.layer_path, `${layer.layer_name}.png`);
  };

  const handleDownloadPsd = async () => {
    if (!result?.photoshop_psd) return;

    try {
      await downloadAsset(result.photoshop_psd, "reconstructed_stack.psd");
    } catch (_) {
      setError("PSD file abhi ready nahi hai. Fallback ke liye Photoshop package download karo.");
    }
  };

  const handleDownloadPackage = async () => {
    if (!result?.photoshop_package) return;

    try {
      await downloadAsset(result.photoshop_package, "photoshop_stack_bundle.zip");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Photoshop package download nahi ho paya.");
    }
  };

  const handleDownloadScript = async () => {
    if (!result?.photoshop_script) return;

    try {
      await downloadAsset(result.photoshop_script, "open_in_photoshop.jsx");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Photoshop script download nahi ho payi.");
    }
  };

  const handleDownloadAll = async () => {
    if (!result?.layers?.length) return;

    for (const layer of result.layers) {
      await downloadImage(layer.layer_path, `${layer.layer_name}.png`);
    }
  };

  const handlePreviewLayer = (layer: ColorSeparationLayer) => {
    setPreviewLayer(layer);
  };

  const handleClosePreview = () => {
    setPreviewLayer(null);
  };

  const handleCancelGeneration = () => {
    colorSeparationAbortRef.current?.abort();
  };

  const handleStartNewDesign = () => {
    requestIdRef.current += 1;
    colorSeparationAbortRef.current?.abort();
    colorSeparationAbortRef.current = null;
    setFile(null);
    setResult(null);
    setError("");
    setRequestMeta(null);
    setPreviewLayer(null);
    setLoading(false);
    setLoadingSeconds(0);
    setNumColors("");
    setMode("auto");
    setCurrentStep('upload');
    setCompletedSteps([]);
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
          <HeroHeader />

          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            <div className="flex-1 space-y-6">
              <Stepper currentStep={currentStep} completedSteps={completedSteps} />

              <div className="grid grid-cols-1 md:grid-cols-[440px_1fr] gap-8 items-start">
                <UploadPreviewCard
                  file={file}
                  previewUrl={previewUrl}
                  dragActive={dragActive}
                  loading={loading}
                  imageMetadata={imageMetadata}
                  onFileChange={(nextFile) => {
                    if (nextFile) {
                      if (!isSupportedImageFile(nextFile)) {
                        setError("Invalid file type. Only PNG, JPG, JPEG images are allowed.");
                        setResult(null);
                        return;
                      }

                      setFile(nextFile);
                      setResult(null);
                      setError("");
                    }
                  }}
                  onDragStateChange={setDragActive}
                  onRemove={handleStartNewDesign}
                  isCollapsed={false}
                  onExpand={() => {}}
                />

                <div className="space-y-6">
                  {currentStep === 'generate' ? (
                    <StatusBanner
                      error={error}
                      result={result}
                      loading={loading}
                      loadingSeconds={loadingSeconds}
                      requestMeta={requestMeta}
                      onCancel={handleCancelGeneration}
                    />
                  ) : (
                    <ControlPanel
                      mode={mode}
                      numColors={numColors}
                      loading={loading}
                      loadingSeconds={loadingSeconds}
                      imageMetadata={imageMetadata}
                      hasFile={Boolean(file)}
                      hasResults={Boolean(result?.layers?.length)}
                      onModeChange={(nextMode) => {
                        setMode(nextMode);
                        if (nextMode === "auto") setNumColors("");
                      }}
                      onNumColorsChange={setNumColors}
                      onSubmit={handleSubmit}
                      onDownloadAll={handleDownloadAll}
                      isCollapsed={false}
                      onExpand={() => {}}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content below the slideshow (Results & Marketing sections) */}
      <div className="relative z-10 mx-auto flex max-w-[1480px] flex-col gap-8 p-5 md:p-7 xl:p-8 pt-0">
        
        {(currentStep === 'export' || completedSteps.includes('export')) && result && (
          <ResultsSection
            result={result}
            onDownloadLayer={handleDownloadLayer}
            onPreviewLayer={handlePreviewLayer}
            onDownloadAll={handleDownloadAll}
            onDownloadPsd={handleDownloadPsd}
            onDownloadPackage={handleDownloadPackage}
            onDownloadScript={handleDownloadScript}
            onStartNew={handleStartNewDesign}
            isCollapsed={currentStep !== 'export'}
            onExpand={() => setCurrentStep('export')}
          />
        )}

        <PreviewModal
          layer={previewLayer}
          isOpen={Boolean(previewLayer)}
          onClose={handleClosePreview}
        />

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
            AI Color Separation: FAQs
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
    </div>
  );
}
