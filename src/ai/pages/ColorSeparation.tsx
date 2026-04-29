import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
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

type RequestMeta = {
  mode: string;
  numColors: number | "";
} | null;

type Step = 'upload' | 'configure' | 'generate' | 'export';
type ImageMetadata = { width: number; height: number; size: string };

const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const SUPPORTED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"];

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
              isActive ? 'border-[#ff1a1a]/20 bg-[#ff1a1a]/10' : 'border-white/10 bg-white/5'
            }`}>
              <div className={`p-2 rounded-full ${
                isCompleted ? 'bg-green-500/20 text-green-400' :
                isCurrent ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' :
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
                completedSteps.includes(steps[index + 1].id) ? 'text-[#ff1a1a]' : 'text-gray-600'
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 text-[#ff1a1a]">
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
    <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff1a1a]/30 bg-[#ff1a1a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#ff1a1a]">
          <Sparkles className="h-4 w-4" /> Textile Separation Engine
        </div>
        <h1 className="text-5xl font-bold uppercase tracking-tight text-white md:text-6xl">
          Color <span className="font-normal text-gray-600">Separation</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400">
          Generate transparent layer stacks, detected palettes, and Photoshop-ready exports for production textile artwork.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left sm:text-right">
        <HeaderMetric label="Output" value="PNG Layers" />
        <HeaderMetric label="Export" value="PSD Ready" />
      </div>
    </header>
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

  if (isCollapsed) {
    return (
      <section className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-colors hover:bg-white/[0.05]" onClick={onExpand}>
        <div className="flex items-center justify-between">
          <PanelHeading
            icon={<ImageUp size={18} />}
            title="Upload Artwork"
            description="Artwork uploaded successfully"
          />
          <CheckCircle2 className="text-green-400" size={24} />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
      <PanelHeading
        icon={<ImageUp size={18} />}
        title="Source Artwork"
        description="Upload a single artwork file for transparent layer extraction."
      />

      <label
        className={`mt-6 flex cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed transition-colors ${
          dragActive
            ? "border-[#ff1a1a] bg-[#ff1a1a]/10 shadow-lg shadow-[#ff1a1a]/20"
            : "border-white/10 bg-black/30 hover:border-[#ff1a1a]/40 hover:bg-white/[0.03] hover:shadow-md"
        } ${previewUrl ? "aspect-[4/3]" : "min-h-[180px] p-6"}`}
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
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
              <Upload size={28} />
            </div>
            <h4 className="text-base font-bold text-white">Drop artwork here or browse from device</h4>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-600">PNG, JPG, JPEG supported</p>
            <span className="mt-3 block text-xs text-gray-500">Transparent pixel-preserving layer generation</span>
          </div>
        ) : (
          <div className="relative group">
            <img className="h-full w-full object-contain" src={previewUrl} alt={file?.name ?? "Uploaded artwork"} />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onRemove(); }}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
                }}
                className="px-3 py-1 bg-[#ff1a1a] text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                Replace
              </button>
            </div>
          </div>
        )}
      </label>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetaTile label="Selected File" value={file?.name ?? "No image selected"} />
        <MetaTile label="Mode" value={previewUrl ? "Ready for generation" : "Awaiting upload"} />
      </div>

      {imageMetadata && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <MetaTile label="Resolution" value={`${imageMetadata.width} x ${imageMetadata.height}`} />
          <MetaTile label="File Size" value={imageMetadata.size} />
          <MetaTile label="Format" value={file?.type.split('/')[1]?.toUpperCase() || 'Unknown'} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <AssuranceChip icon={<Info size={15} />} text="PNG, JPG, JPEG supported" />
        <AssuranceChip icon={<Layers3 size={15} />} text="Transparent pixel-preserving generation" />
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
                  ? "border-[#ff1a1a]/40 bg-[#ff1a1a]/10"
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
          <div className="mt-4 p-3 bg-[#ff1a1a]/10 border border-[#ff1a1a]/20 rounded-xl">
            <div className="flex items-center gap-2 text-[#ff1a1a]">
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
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-700 focus:border-[#ff1a1a]/50 disabled:cursor-not-allowed disabled:opacity-40"
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
        <button
          type="button"
          className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white transition-colors ${
            loading ? 'bg-gray-700' : 'bg-[#ff1a1a] hover:bg-red-700'
          } disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={!hasFile || loading}
          onClick={onSubmit}
        >
          {loading && (
            <div className="absolute inset-y-0 left-0 bg-[#ff1a1a]" style={{ width: `${loadingProgressPercent}%` }} />
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
    <div className="rounded-[28px] border border-[#ff1a1a]/20 bg-[#ff1a1a]/5 p-6 backdrop-blur">
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
    ? "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ff1a1a] bg-[#ff1a1a] px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40 disabled:opacity-40"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ff1a1a]/70 bg-[#ff1a1a] px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
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
    <div className="min-h-screen bg-[#050505] p-4 text-white md:p-8 lg:p-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-full -translate-x-1/2 bg-[#ff1a1a]/5 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-[1500px] space-y-8">
        <HeroHeader />

        <Stepper currentStep={currentStep} completedSteps={completedSteps} />

        {(currentStep === 'upload' || completedSteps.includes('upload')) && (
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
            isCollapsed={currentStep !== 'upload'}
            onExpand={() => setCurrentStep('upload')}
          />
        )}

        {(currentStep === 'configure' || completedSteps.includes('configure')) && (
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
            isCollapsed={currentStep !== 'configure'}
            onExpand={() => setCurrentStep('configure')}
          />
        )}

        {currentStep === 'generate' && (
          <StatusBanner
            error={error}
            result={result}
            loading={loading}
            loadingSeconds={loadingSeconds}
            requestMeta={requestMeta}
            onCancel={handleCancelGeneration}
          />
        )}

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
      </div>
    </div>
  );
}