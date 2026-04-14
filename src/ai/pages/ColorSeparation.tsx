import React, { useEffect, useMemo, useState } from "react";
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
  Sparkles,
  SwatchBook,
  Upload,
  XCircle,
  Zap,
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
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff1a1a]/10 via-transparent to-transparent" />
      <div className="relative grid gap-8 p-8 lg:grid-cols-[1fr_380px] lg:p-12">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff1a1a]">
            <Sparkles className="h-3 w-3" /> Precision Textile Engine
          </span>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white lg:text-7xl">
            Color <span className="text-gray-600 font-light">Separation</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-gray-400 lg:text-base">
            Generate Photoshop-ready transparent reconstructable layers with a production-grade textile workflow.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {["Transparent Layer Stack", "Manual Or Auto Palette", "Studio Reconstruction Ready"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
          <div className="grid gap-3">
            <HeroStat label="Output Format" value="Transparent PNG" />
            <HeroStat label="Reconstruction" value="Pixel Preserving" />
            <HeroStat label="Pipeline" value="Studio Ready" />
          </div>
          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
            {[
              ["01", "Upload Artwork"],
              ["02", "Set Color Logic"],
              ["03", "Export Layers"],
            ].map(([step, label], index) => (
              <div
                key={step}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                  index === 0
                    ? "border-[#ff1a1a]/20 bg-[#ff1a1a]/10 text-white"
                    : "border-white/5 bg-black/20 text-gray-500"
                }`}
              >
                <span className="text-[10px] font-black tracking-widest text-[#ff1a1a]">{step}</span>
                <strong className="text-xs uppercase tracking-widest">{label}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">{label}</span>
      <strong className="mt-1 block text-sm text-white">{value}</strong>
    </div>
  );
}

function UploadPreviewCard({
  file,
  previewUrl,
  dragActive,
  loading,
  onFileChange,
  onDragStateChange,
}: {
  file: File | null;
  previewUrl: string;
  dragActive: boolean;
  loading: boolean;
  onFileChange: (file?: File) => void;
  onDragStateChange: (active: boolean) => void;
}) {
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onDragStateChange(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onFileChange(droppedFile);
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
      <PanelHeading
        icon={<ImageUp size={18} />}
        title="Source Artwork"
        description="Upload a single artwork file for transparent layer extraction."
      />

      <label
        className={`mt-6 flex cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed transition-all ${
          dragActive
            ? "border-[#ff1a1a] bg-[#ff1a1a]/10"
            : "border-white/10 bg-black/30 hover:border-[#ff1a1a]/40 hover:bg-white/[0.03]"
        } ${previewUrl ? "aspect-[4/3]" : "min-h-[260px] p-8"}`}
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
          <img className="h-full w-full object-contain" src={previewUrl} alt={file?.name ?? "Uploaded artwork"} />
        )}
      </label>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetaTile label="Selected File" value={file?.name ?? "No image selected"} />
        <MetaTile label="Mode" value={previewUrl ? "Ready for generation" : "Awaiting upload"} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <AssuranceChip icon={<Info size={15} />} text="PNG, JPG, JPEG supported" />
        <AssuranceChip icon={<Layers3 size={15} />} text="Transparent pixel-preserving generation" />
      </div>
    </section>
  );
}

function MetaTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
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
  hasFile,
  hasResults,
  onModeChange,
  onNumColorsChange,
  onSubmit,
  onDownloadAll,
}: {
  mode: string;
  numColors: string;
  loading: boolean;
  hasFile: boolean;
  hasResults: boolean;
  onModeChange: (mode: string) => void;
  onNumColorsChange: (value: string) => void;
  onSubmit: () => void;
  onDownloadAll: () => void;
}) {
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
              className={`rounded-2xl border p-4 text-left transition-all ${
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
                  ? "Backend identifies the palette automatically."
                  : "You define the number of target colors."}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <PanelHeading icon={<Palette size={18} />} title="Number of Colors" description="Leave empty for auto detect." />

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
            placeholder="Optional manual value"
            disabled={mode !== "manual" || loading}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-700 focus:border-[#ff1a1a]/50 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>
        <p className="mt-3 text-xs leading-relaxed text-gray-600">
          Manual mode enables this field. Auto Detect submits without <code>num_colors</code>.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <PanelHeading icon={<Layers3 size={18} />} title="Output Info" description="Production details for downstream design tooling." />

        <div className="mt-6 grid gap-3">
          <MetaTile label="Output Format" value="Transparent PNG" />
          <MetaTile label="Reconstruction" value="Photoshop Ready" />
          <MetaTile label="Layer Type" value="Original Pixel Preserving" />
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <div className="mb-5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Execution</span>
          <strong className="mt-1 block text-sm text-white">Generate premium reconstructable color layers</strong>
        </div>
        <button
          type="button"
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#ff1a1a] py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!hasFile || loading}
          onClick={onSubmit}
        >
          {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
          <span>{loading ? "Generating Layers..." : "Generate Layers"}</span>
        </button>

        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          disabled={!hasResults || loading}
          onClick={onDownloadAll}
        >
          <Download size={18} />
          <span>Download All Layers</span>
        </button>

        <p className="mt-4 text-xs leading-relaxed text-gray-600">
          {mode === "manual"
            ? "Manual mode is usually faster because the backend can skip the auto-detect search."
            : "Auto Detect is slower because the backend tests several palette sizes before it exports the final layers."}
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
  timeoutSeconds = COLOR_SEPARATION_TIMEOUT_SECONDS,
}: {
  error: string;
  result: ColorSeparationResult | null;
  loading: boolean;
  loadingSeconds?: number;
  requestMeta: RequestMeta;
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
    <StatusShell tone="idle" icon={<Sparkles size={18} />}>
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
    <StatusShell tone={hasMismatch ? "error" : "idle"} icon={<Sparkles size={18} />}>
      <strong>Request Mode: {requestMeta.mode === "manual" ? "Manual" : "Auto Detect"}</strong>
      <p>
        {requestedCount !== null
          ? `Requested ${requestedCount} colors. Backend returned ${generatedCount} layers.`
          : `Submitted without num_colors, so backend used auto detection and returned ${generatedCount} layers.`}
      </p>
    </StatusShell>
  );
}

function ResultImageCard({
  title,
  description,
  imagePath,
  fallbackText,
  checkerboard = false,
}: {
  title: string;
  description: string;
  imagePath?: string;
  fallbackText: string;
  checkerboard?: boolean;
}) {
  const imageUrl = getFullImageUrl(imagePath);

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
      <PanelHeading icon={<ImageUp size={18} />} title={title} description={description} />

      <div className={`mt-6 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[24px] border border-white/5 bg-black/40 ${checkerboard ? "bg-[linear-gradient(45deg,rgba(255,255,255,.08)_25%,transparent_25%),linear-gradient(-45deg,rgba(255,255,255,.08)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(255,255,255,.08)_75%),linear-gradient(-45deg,transparent_75%,rgba(255,255,255,.08)_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]" : ""}`}>
        {imageUrl ? (
          <img className="h-full w-full object-contain" src={imageUrl} alt={title} />
        ) : (
          <div className="px-6 text-center text-xs text-gray-600">{fallbackText}</div>
        )}
      </div>
    </div>
  );
}

function LayerCard({
  layer,
  onDownloadLayer,
}: {
  layer: ColorSeparationLayer;
  onDownloadLayer: (layer: ColorSeparationLayer) => void;
}) {
  const [activeView, setActiveView] = useState("original");
  const hasFlatLayer = Boolean(layer.flat_layer_path);
  const originalUrl = getFullImageUrl(layer.layer_path);
  const flatUrl = getFullImageUrl(layer.flat_layer_path || layer.layer_path);
  const previewUrl = activeView === "flat" ? flatUrl : originalUrl;
  const previewLabel = activeView === "flat" && hasFlatLayer ? "Flat Color Layer" : "Original Layer";

  return (
    <article className="rounded-[24px] border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-sm font-black text-white">{layer.layer_name}</h4>
            {layer.detected_color ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono text-gray-400">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: layer.detected_color }} />
                {layer.detected_color}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Layer {layer.layer_index}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-black/30 p-1">
        {[
          ["original", "Original Layer"],
          ["flat", "Flat Color Layer"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeView === value ? "bg-[#ff1a1a] text-white" : "text-gray-600 hover:text-white"
            }`}
            onClick={() => setActiveView(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-600">
          <span>{previewLabel}</span>
          {!hasFlatLayer && activeView === "flat" ? <small>Using original preview</small> : null}
        </div>
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-[linear-gradient(45deg,rgba(255,255,255,.08)_25%,transparent_25%),linear-gradient(-45deg,rgba(255,255,255,.08)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(255,255,255,.08)_75%),linear-gradient(-45deg,transparent_75%,rgba(255,255,255,.08)_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
          {previewUrl ? (
            <img className="h-full w-full object-contain" src={previewUrl} alt={`${layer.layer_name} ${previewLabel}`} />
          ) : (
            <div className="text-xs text-gray-600">Layer preview unavailable</div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <a
          href={previewUrl || originalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Eye size={16} />
          <span>Open</span>
        </a>
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
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
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
        <ExportButton disabled={!result.photoshop_psd} onClick={onDownloadPsd}>Download PSD</ExportButton>
        <ExportButton disabled={!result.photoshop_package} onClick={onDownloadPackage}>Download Package</ExportButton>
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
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Download size={16} />
      {children}
    </button>
  );
}

function ResultsSection({
  result,
  onDownloadLayer,
  onDownloadPsd,
  onDownloadPackage,
  onDownloadScript,
}: {
  result: ColorSeparationResult | null;
  onDownloadLayer: (layer: ColorSeparationLayer) => void;
  onDownloadPsd: () => void;
  onDownloadPackage: () => void;
  onDownloadScript: () => void;
}) {
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
  const reconstructionExactLabel =
    typeof result.reconstruction_exact === "boolean"
      ? result.reconstruction_exact
        ? "Exact Match"
        : "Preview Differs"
      : "Status Pending";

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ResultImageCard
          title="Original Image"
          description="Uploaded artwork returned by the backend for reference."
          imagePath={result.original_image}
          fallbackText="Original image preview unavailable."
        />
        <ResultImageCard
          title="Reconstructed Preview"
          description="Backend reconstruction preview for visual verification."
          imagePath={result.reconstructed_preview}
          fallbackText="Reconstructed preview is not available in this response."
          checkerboard
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <PanelHeading icon={<Palette size={18} />} title="Detected Palette" description="Extracted colors prepared for layer reconstruction." />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detectedColors.length ? (
              detectedColors.map((color, index) => (
                <div key={`${color}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-3">
                  <div className="h-12 w-12 rounded-xl border border-white/10" style={{ backgroundColor: color }} />
                  <div>
                    <small className="block text-[9px] font-black uppercase tracking-widest text-gray-600">Detected Tone</small>
                    <span className="font-mono text-xs text-white/80">{color}</span>
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
          <PanelHeading icon={<CheckCircle2 size={18} />} title="Output Summary" description="Ready for Photoshop recombination and downstream textile work." />

          <div className="mt-6 grid gap-3">
            <MetaTile label="Total Colors" value={totalColors} />
            <MetaTile label="Reconstructable Output" value={result.reconstructable ? "Enabled" : "Disabled"} />
            <MetaTile label="Reconstruction Exact" value={reconstructionExactLabel} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill success={Boolean(result.reconstructable)} icon={<Layers3 size={14} />}>
              {result.reconstructable ? "Reconstructable" : "Not Reconstructable"}
            </StatusPill>
            <StatusPill success={result.reconstruction_exact === true} warning={result.reconstruction_exact === false} icon={<SwatchBook size={14} />}>
              {reconstructionExactLabel}
            </StatusPill>
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
            title="Separated Layers"
            description="Each layer supports reconstructable and flat-color previews with graceful fallbacks."
          />
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            {layers.length} Ready
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {layers.length ? (
            layers.map((layer) => (
              <LayerCard key={layer.layer_index} layer={layer} onDownloadLayer={onDownloadLayer} />
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

function StatusPill({
  success,
  warning = false,
  icon,
  children,
}: {
  success: boolean;
  warning?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const tone = success
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : warning
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-white/10 bg-white/5 text-gray-500";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${tone}`}>
      {icon}
      {children}
    </span>
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

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

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

  const derivedNumColors = useMemo(() => {
    if (mode !== "manual") return "";
    const normalizedValue = numColors.trim();
    if (!normalizedValue) return "";
    return Number(normalizedValue);
  }, [mode, numColors]);

  const handleSubmit = async () => {
    if (!file) return;

    const requestMode = mode;
    const requestNumColors = derivedNumColors;

    try {
      setLoading(true);
      setLoadingSeconds(0);
      setError("");
      setResult(null);
      setRequestMeta({
        mode: requestMode,
        numColors: requestNumColors,
      });

      const response = await separateColors(file, requestNumColors);
      setResult(response);
    } catch (requestError) {
      setError(getColorSeparationErrorMessage(requestError));
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-[#050505] p-4 text-white md:p-8 lg:p-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-full -translate-x-1/2 bg-[#ff1a1a]/5 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-[1500px] space-y-8">
        <HeroHeader />

        <StatusBanner
          error={error}
          result={result}
          loading={loading}
          loadingSeconds={loadingSeconds}
          requestMeta={requestMeta}
        />
        <RequestAudit requestMeta={requestMeta} result={result} />

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <UploadPreviewCard
            file={file}
            previewUrl={previewUrl}
            dragActive={dragActive}
            loading={loading}
            onFileChange={(nextFile) => {
              if (nextFile) {
                setFile(nextFile);
                setResult(null);
                setError("");
              }
            }}
            onDragStateChange={setDragActive}
          />

          <ControlPanel
            mode={mode}
            numColors={numColors}
            loading={loading}
            hasFile={Boolean(file)}
            hasResults={Boolean(result?.layers?.length)}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              if (nextMode === "auto") setNumColors("");
            }}
            onNumColorsChange={setNumColors}
            onSubmit={handleSubmit}
            onDownloadAll={handleDownloadAll}
          />
        </section>

        <ResultsSection
          result={result}
          onDownloadLayer={handleDownloadLayer}
          onDownloadPsd={handleDownloadPsd}
          onDownloadPackage={handleDownloadPackage}
          onDownloadScript={handleDownloadScript}
        />
      </div>
    </div>
  );
}
