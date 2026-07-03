import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  CloudUpload,
  Download,
  Image as ImageIcon,
  Loader2,
  Minus,
  Plus,
  Palette,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

import {
  buildBackgroundForm,
  buildPresetForm,
  generateImage,
  normalizeBackendImageUrl,
  resolveImageUrl,
} from "@/api/imageToImageApi";
import { PRESET_CATEGORIES, type GenerateResponse, type PresetId } from "@/types/textile";

type Mode = "preset" | "background";

const BACKGROUND_OPTIONS = [
  { label: "White Background", value: "#FFFFFF" },
  { label: "Ivory", value: "#F7F1E6" },
  { label: "Warm Beige", value: "#EFE1CC" },
  { label: "Sand", value: "#E8D2B5" },
  { label: "Soft Gray", value: "#D9D9D9" },
  { label: "Charcoal", value: "#1F1B17" },
] as const;

const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"];
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "#000000";
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return prefixed.toUpperCase();
};

const isValidHexColor = (value: string) => /^#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(value.trim());

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getPresetMeta = (preset: PresetId) =>
  PRESET_CATEGORIES.flatMap((category) => category.presets).find((item) => item.id === preset);

const extractOutputUrls = (data: GenerateResponse) => {
  const urls = [...(data.image_urls ?? []), ...(data.output_url ? [data.output_url] : [])]
    .map((url) => normalizeBackendImageUrl(resolveImageUrl(url)))
    .filter(Boolean);

  return Array.from(new Set(urls));
};

const getFriendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || "Color matching request failed.");

  if (/network|connection|failed to fetch|ERR_CONNECTION_RESET|unavailable/i.test(message)) {
    return "AI color matching service is unavailable. Please try again in a moment.";
  }

  return message || "Color matching request failed.";
};

export default function ColorMatchingStudio() {
  const [mode, setMode] = useState<Mode>("preset");
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("monotone");
  const [selectedShadeIndex, setSelectedShadeIndex] = useState(0);
  const [openCategory, setOpenCategory] = useState(PRESET_CATEGORIES[0]?.title ?? "");
  const [paletteOverrides, setPaletteOverrides] = useState<Partial<Record<PresetId, string[]>>>({});
  const [backgroundColor, setBackgroundColor] = useState<string>(BACKGROUND_OPTIONS[0].value);
  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Upload a textile image to begin.");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [selectedResultUrl, setSelectedResultUrl] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<GenerateResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  const selectedPresetMeta = useMemo(() => getPresetMeta(selectedPreset), [selectedPreset]);
  const currentPalette = useMemo(() => {
    if (!selectedPresetMeta) return [];
    return paletteOverrides[selectedPreset] ?? selectedPresetMeta.colors;
  }, [paletteOverrides, selectedPreset, selectedPresetMeta]);
  const activePaletteColor = currentPalette[selectedShadeIndex] ?? currentPalette[0] ?? backgroundColor;
  const activeBackground = useMemo(
    () =>
      BACKGROUND_OPTIONS.find((item) => item.value === backgroundColor) ?? {
        label: "Custom Hex",
        value: backgroundColor || BACKGROUND_OPTIONS[0].value,
      },
    [backgroundColor]
  );
  const backgroundOptions = useMemo(() => {
    const hasCustom = BACKGROUND_OPTIONS.some((item) => item.value === backgroundColor);
    return hasCustom
      ? BACKGROUND_OPTIONS
      : [{ label: `Custom ${backgroundColor}`, value: backgroundColor }, ...BACKGROUND_OPTIONS];
  }, [backgroundColor]);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resultUrls.length > 0 && !selectedResultUrl) {
      setSelectedResultUrl(resultUrls[0]);
    }
  }, [resultUrls, selectedResultUrl]);

  useEffect(() => {
    if (selectedShadeIndex >= currentPalette.length) {
      setSelectedShadeIndex(0);
    }
  }, [currentPalette.length, selectedShadeIndex]);

  const clearResult = () => {
    setResultUrls([]);
    setSelectedResultUrl(null);
    setLastResponse(null);
  };

  const updatePaletteColor = (index: number, value: string) => {
    const nextColor = normalizeHexColor(value);

    if (!isValidHexColor(nextColor)) {
      return;
    }

    setPaletteOverrides((current) => {
      const existing = current[selectedPreset] ?? currentPalette;
      const nextPalette = existing.map((color, currentIndex) => (currentIndex === index ? nextColor : color));

      return {
        ...current,
        [selectedPreset]: nextPalette,
      };
    });
  };

  const setFilePreview = (file: File) => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    previewRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  };

  const handleFileSelection = (file?: File | null) => {
    if (!file) return;

    const normalizedName = file.name.toLowerCase();
    const isAllowed =
      ALLOWED_IMAGE_TYPES.includes(file.type) ||
      ALLOWED_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));

    if (!isAllowed) {
      setError("Please upload a PNG, JPG, JPEG, WEBP, BMP, TIF, or TIFF image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Please use an image under ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setFilePreview(file);
    clearResult();
    setStatus("Image loaded. Pick a preset and generate.");
  };

  const changeNumImages = (delta: number) => {
    setNumImages((current) => Math.max(1, Math.min(4, current + delta)));
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setStatus("Please upload an image first.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setStatus(mode === "background" ? "Applying background edit..." : "Generating preset match...");
      clearResult();

      const form =
        mode === "background"
          ? buildBackgroundForm({
              file: selectedFile,
              backgroundColor: activeBackground.value,
              prompt: prompt.trim() || undefined,
              numImages,
            })
          : buildPresetForm({
              file: selectedFile,
              preset: selectedPreset,
              targetColor: activePaletteColor,
              prompt: prompt.trim() || undefined,
              numImages,
            });

      const response = await generateImage(form);
      const urls = extractOutputUrls(response);

      setLastResponse(response);
      setResultUrls(urls);
      setSelectedResultUrl(urls[0] ?? null);
      setStatus(
        urls.length
          ? `Generated ${urls.length} output${urls.length > 1 ? "s" : ""}.`
          : "Generation finished, but no output URL was returned."
      );
    } catch (err) {
      setError(getFriendlyError(err));
      setStatus("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ecdf] text-[#241b15]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[#d69a6a]/20 blur-[150px]" />
        <div className="absolute right-[-12%] top-[6%] h-[420px] w-[420px] rounded-full bg-[#e11d2e]/8 blur-[150px]" />
        <div className="absolute bottom-[-12%] left-[16%] h-[360px] w-[360px] rounded-full bg-[#9aa899]/18 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(129,96,58,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(129,96,58,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.18]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <header className="flex flex-col gap-5 border-b border-[#d8c5a8] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7c4a9] bg-[#fffaf1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8d6a43]">
              <Sparkles className="h-3.5 w-3.5 text-[#e11d2e]" />
              RDC AI Studio / Color
            </div>
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1d1712] md:text-6xl">
                AI Color Matching
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#685241] md:text-base">
                Select a preset, open its subpreset, choose a background tone, and generate a print-ready textile variation.
              </p>
              <p className="mt-3 inline-flex rounded-full border border-[#d7c4a9] bg-[#fffaf1] px-3 py-1 text-[11px] font-medium text-[#8a6a47]">
                Presets are grouped exactly for quick production matching.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#e11d2e] px-5 text-sm font-semibold text-white transition hover:bg-[#ff3347]"
            >
              <CloudUpload className="h-4 w-4" />
              Upload Design
            </button>
            <Link
              to="/ai-studio/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d7c4a9] bg-[#fffaf1] px-5 text-sm font-semibold text-[#685241] transition hover:border-[#e11d2e]/35 hover:text-[#1d1712]"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-[#b84a4a]/30 bg-[#f8d7d7] px-4 py-3 text-sm text-[#7a2424]">
            {error}
          </div>
        )}

        <main className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[30px] border border-[#d7c4a9] bg-[#fffaf3] p-4 shadow-[0_24px_80px_rgba(76,53,25,0.12)] md:p-5">
            <div className="space-y-6">
              <ControlSection title="01 - Upload">
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDragOver(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragOver(false);
                    handleFileSelection(event.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-5 text-center transition ${
                    isDragOver
                      ? "border-[#e11d2e] bg-[#f9e5e5]"
                      : "border-[#d4c0a0] bg-[#f7efe3]"
                  }`}
                >
                  {previewUrl ? (
                    <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-[#dbc6a2] bg-white">
                      <img src={previewUrl} alt="Source preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          clearResult();
                          if (previewRef.current) {
                            URL.revokeObjectURL(previewRef.current);
                            previewRef.current = null;
                          }
                        }}
                        className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white transition hover:bg-[#e11d2e]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-left text-white">
                        <p className="text-sm font-semibold">{selectedFile?.name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/75">
                          {selectedFile ? formatBytes(selectedFile.size) : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#caa87b] bg-[#fff5e8] text-[#8a6a47]">
                        <CloudUpload className="h-6 w-6" />
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-[#2c2017]">Drop textile image here</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#8a6a47]">
                          PNG · JPG · JPEG · WEBP · BMP · TIF · TIFF
                        </p>
                        <p className="mt-2 text-[11px] text-[#9b866f]">
                          Keep files under {formatBytes(MAX_FILE_SIZE_BYTES)}.
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
                    className="hidden"
                    onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
                  />
                </label>
              </ControlSection>

              <ControlSection title="02 - Quick Presets">
                <div className="space-y-3">
                  {PRESET_CATEGORIES.map((category) => {
                    const isOpen = openCategory === category.title;

                    return (
                      <div
                        key={category.title}
                        className="overflow-hidden rounded-2xl border border-[#d9c6a8] bg-[#fffaf5]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenCategory((current) => (current === category.title ? "" : category.title))
                          }
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#f8efe3]"
                        >
                          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1d1712]">
                            {category.title}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#9a8467] transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isOpen && (
                          <div className="border-t border-[#e6d5bb] px-3 py-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              {category.presets.map((preset) => {
                                const active = selectedPreset === preset.id;

                                return (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPreset(preset.id);
                                      setSelectedShadeIndex(0);
                                      setOpenCategory(category.title);
                                    }}
                                    className={`rounded-2xl border p-3 text-left transition ${
                                      active
                                        ? "border-[#9e702f] bg-[#f3e1c2] shadow-[0_12px_30px_rgba(134,90,30,0.12)]"
                                        : "border-[#d8c8af] bg-[#fffdf9] hover:border-[#b48a56]"
                                    }`}
                                  >
                                    <div className="mb-3 flex items-center gap-2">
                                      {preset.colors.slice(0, 4).map((color) => (
                                        <span
                                          key={color}
                                          className="h-6 w-6 rounded-full border border-white shadow-sm"
                                          style={{ backgroundColor: color }}
                                        />
                                      ))}
                                    </div>
                                    <p className="text-sm font-semibold text-[#241b15]">{preset.label}</p>
                                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#8f785f]">
                                      {preset.id.replace(/_/g, " ")}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedPresetMeta && (
                  <div className="mt-4 rounded-2xl border border-[#d9c7a9] bg-[#fffaf4] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6a47]">
                          Selected Preset
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#241b15]">{selectedPresetMeta.label}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#9a8467]">
                        {selectedPresetMeta.id}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentPalette.map((color, index) => (
                        <button
                          key={`${selectedPreset}-${index}-${color}`}
                          type="button"
                          onClick={() => setSelectedShadeIndex(index)}
                          className={`h-8 w-8 rounded-full border shadow-sm transition ${
                            selectedShadeIndex === index
                              ? "border-[#8b622e] ring-2 ring-[#8b622e]/25"
                              : "border-white"
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select shade ${index + 1}`}
                        />
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#e0cfb6] bg-[#fffdf9] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a47]">
                            Custom color
                          </p>
                          <p className="mt-1 text-sm text-[#5f4b3b]">
                            Edit the active shade by hex code or color picker.
                          </p>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-[#9a8467]">
                          Shade {selectedShadeIndex + 1}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <label className="grid gap-2 rounded-2xl border border-[#d8c6a7] bg-white p-3">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a47]">
                            Hex Code
                          </span>
                          <input
                            type="text"
                            value={activePaletteColor}
                            onChange={(event) => updatePaletteColor(selectedShadeIndex, event.target.value)}
                            className="w-full rounded-xl border border-[#d8c6a7] bg-[#fffaf3] px-3 py-2 text-sm font-semibold text-[#241b15] outline-none transition focus:border-[#e11d2e]/45"
                          />
                        </label>

                        <label className="grid gap-2 rounded-2xl border border-[#d8c6a7] bg-white p-3">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a47]">
                            Pick
                          </span>
                          <input
                            type="color"
                            value={activePaletteColor}
                            onChange={(event) => updatePaletteColor(selectedShadeIndex, event.target.value)}
                            className="h-11 w-16 cursor-pointer rounded-xl border border-[#d8c6a7] bg-transparent p-1"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setBackgroundColor(normalizeHexColor(activePaletteColor))}
                          className="self-end rounded-2xl bg-[#8b622e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a77439]"
                        >
                          Use Color
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {currentPalette.map((color, index) => (
                          <label
                            key={`${selectedPreset}-editable-${index}`}
                            className={`grid gap-2 rounded-2xl border p-3 transition ${
                              selectedShadeIndex === index
                                ? "border-[#8b622e] bg-[#f7ebd6]"
                                : "border-[#e0cfb6] bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a47]">
                                Shade {index + 1}
                              </span>
                              <span className="text-[10px] uppercase tracking-[0.22em] text-[#9a8467]">
                                {color}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedShadeIndex(index)}
                                className="h-10 w-10 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: color }}
                                aria-label={`Focus shade ${index + 1}`}
                              />
                              <input
                                type="text"
                                value={color}
                                onChange={(event) => updatePaletteColor(index, event.target.value)}
                                className="min-w-0 flex-1 rounded-xl border border-[#d8c6a7] bg-[#fffdf9] px-3 py-2 text-sm font-semibold text-[#241b15] outline-none transition focus:border-[#e11d2e]/45"
                              />
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#e0cfb6] bg-[#fffaf3] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[#241b15]">
                            Your {selectedPresetMeta.label} Palette
                          </p>
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#9a8467]">
                            COLOR_PALETTE
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-5 gap-2">
                          {currentPalette.map((color, index) => (
                            <button
                              key={`${selectedPreset}-preview-${index}`}
                              type="button"
                              onClick={() => setSelectedShadeIndex(index)}
                              className={`h-10 rounded-lg border-2 transition ${
                                selectedShadeIndex === index
                                  ? "border-[#8b622e]"
                                  : "border-[#d8c6a7]"
                              }`}
                              style={{ backgroundColor: color }}
                              aria-label={`Preview shade ${index + 1}`}
                            />
                          ))}
                        </div>
                        <div className="mt-3 grid grid-cols-5 gap-2 text-center text-[11px] font-semibold text-[#6b5845]">
                          {currentPalette.map((color, index) => (
                            <div
                              key={`${selectedPreset}-preview-value-${index}`}
                              className="rounded-lg border border-[#e3d1b8] bg-white px-2 py-1"
                            >
                              {color}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ControlSection>

              <ControlSection title="03 - Background">
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                        <label className="grid gap-2 rounded-2xl border border-[#d8c6a7] bg-[#fffdf9] p-4">
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a47]">
                            Background Tone
                          </span>
                          <div className="relative">
                            <select
                              value={backgroundColor}
                              onChange={(event) =>
                                setBackgroundColor(event.target.value)
                              }
                              className="w-full appearance-none rounded-xl border border-[#d8c6a7] bg-[#fffaf3] px-3 py-2.5 pr-10 text-sm text-[#241b15] outline-none transition focus:border-[#e11d2e]/45"
                            >
                              {backgroundOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label} {option.value}
                                </option>
                              ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8467]" />
                        </div>
                      </label>

                  <label className="grid gap-2 rounded-2xl border border-[#d8c6a7] bg-[#fffdf9] p-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a47]">
                      Preview
                    </span>
                    <div
                      className="h-[52px] rounded-xl border border-[#dbc6a2]"
                      style={{ backgroundColor: activeBackground.value }}
                    />
                  </label>
                </div>
              </ControlSection>

              <ControlSection title="04 - Prompt">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder='Optional. Example: "Keep the floral layout clean and modern."'
                  className="h-32 w-full resize-none rounded-2xl border border-[#d8c6a7] bg-[#fffdf9] p-4 text-sm text-[#241b15] placeholder:text-[#a18c75] outline-none transition focus:border-[#e11d2e]/45"
                />
              </ControlSection>

              <ControlSection title="05 - Generate">
                <div className="space-y-4">
                  <div className="grid gap-2 rounded-2xl border border-[#d9c6a7] bg-[#fffaf4] p-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode("preset")}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        mode === "preset"
                          ? "bg-[#e11d2e] text-white shadow-sm"
                          : "text-[#735f49] hover:bg-[#f6ead7]"
                      }`}
                    >
                      Preset Match
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("background")}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        mode === "background"
                          ? "bg-[#e11d2e] text-white shadow-sm"
                          : "text-[#735f49] hover:bg-[#f6ead7]"
                      }`}
                    >
                      Background Change
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-[#d9c6a7] bg-[#fffaf4] p-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a47]">Outputs</p>
                      <p className="mt-1 text-sm text-[#5f4b3b]">
                        Generate 1 to 4 variations based on the selected preset.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-[#d8c6a7] bg-[#fffdf9] p-2">
                      <button
                        type="button"
                        onClick={() => changeNumImages(-1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8c6a7] bg-[#fffaf3] text-[#4f3b2c] transition hover:border-[#e11d2e]/30"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold text-[#1f1711]">{numImages}</span>
                      <button
                        type="button"
                        onClick={() => changeNumImages(1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8c6a7] bg-[#fffaf3] text-[#4f3b2c] transition hover:border-[#e11d2e]/30"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={!selectedFile || isGenerating}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#8b622e] px-5 text-sm font-semibold text-white transition hover:bg-[#a77439] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {isGenerating
                      ? "Generating..."
                      : mode === "background"
                        ? "Apply Background"
                        : "Generate Design"}
                  </button>
                </div>
              </ControlSection>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-[30px] border border-[#2c2622] bg-[#181210] p-5 text-[#f7f2ea] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#b49b7a]">
                    <Palette className="h-4 w-4 text-[#e11d2e]" />
                    Results
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {selectedFile ? "Preview and outputs" : "Upload an image to begin"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#9a8d7b]">
                    {status}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#b49b7a]">
                    {mode === "background" ? "Background Mode" : "Preset Mode"}
                  </span>
                  {lastResponse?.model && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#b49b7a]">
                      {lastResponse.model}
                    </span>
                  )}
                  {lastResponse?.fallback_used && (
                    <span className="rounded-full border border-[#e11d2e]/20 bg-[#e11d2e]/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#ffb2bb]">
                      Fallback Used
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111315]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a18f79]">
                      Source
                    </span>
                    {selectedFile && (
                      <span className="text-[10px] uppercase tracking-[0.24em] text-[#6f6557]">
                        {selectedFile.name}
                      </span>
                    )}
                  </div>
                  <div className="relative min-h-[360px] bg-black/25 p-4">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Source preview" className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full min-h-[360px] items-center justify-center text-center text-sm text-[#6f6557]">
                        <div className="space-y-2">
                          <ImageIcon className="mx-auto h-10 w-10 text-[#e11d2e]" />
                          <p>Upload an image to begin.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111315]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a18f79]">
                      Output
                    </span>
                    {selectedResultUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDownload(
                            selectedResultUrl,
                            `ai-color-matching-${selectedPresetMeta?.id || "output"}.png`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-[#e11d2e]/30 bg-[#e11d2e]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffb2bb] transition hover:border-[#e11d2e]/50 hover:bg-[#e11d2e]/20 hover:text-white"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    )}
                  </div>
                  <div className="relative min-h-[360px] bg-black/25 p-4">
                    {selectedResultUrl ? (
                      <img src={selectedResultUrl} alt="Generated output" className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full min-h-[360px] items-center justify-center text-center text-sm text-[#6f6557]">
                        <div className="space-y-2">
                          <Wand2 className="mx-auto h-10 w-10 text-[#e11d2e]" />
                          <p>Generated output will appear here.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {resultUrls.length > 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {resultUrls.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setSelectedResultUrl(url)}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        selectedResultUrl === url
                          ? "border-[#e11d2e]/50 bg-white/8"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <img src={url} alt={`Output ${index + 1}`} className="h-36 w-full object-cover" />
                      <div className="flex items-center justify-between gap-3 px-3 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Variation {index + 1}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#827666]">
                            {mode === "background" ? "Background Edit" : selectedPresetMeta?.label}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDownload(url, `ai-color-matching-${index + 1}.png`);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d7c4a9] transition hover:border-[#e11d2e]/35 hover:text-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Save
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <DetailCard label="File" value={selectedFile ? selectedFile.name : "Awaiting upload"} />
              <DetailCard label="Preset" value={selectedPresetMeta?.label ?? "Monotone"} />
              <DetailCard
                label="Target Color"
                value={mode === "background" ? activeBackground.value : activePaletteColor}
              />
              <DetailCard label="Background" value={`${activeBackground.label} (${activeBackground.value})`} />
            </div>

            {lastResponse?.final_prompt && (
              <div className="rounded-[24px] border border-[#d7c4a9] bg-[#fffaf3] p-4 text-sm text-[#5f4b3b]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a47]">
                  Final Prompt
                </p>
                <p className="mt-2 leading-6">{lastResponse.final_prompt}</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function ControlSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[#dcc8aa] bg-[#fffdf8] p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8a6a47]">{title}</p>
      {children}
    </section>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#2f2924] bg-[#1d1713] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a18f79]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
