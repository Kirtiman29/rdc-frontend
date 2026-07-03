import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  CloudUpload,
  Download,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";

import { generateImage, normalizeBackendImageUrl, resolveImageUrl } from "@/api/imageToImageApi";
import { PRESET_CATEGORIES, type GenerateResponse, type PresetId } from "@/types/textile";

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
  "image/tiff",
];
const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const PASTEL_MOOD_PALETTES = [
  {
    id: "soft",
    label: "Soft Pastel - Blush pink, cream, lavender, mint",
    colors: ["#F7B7C8", "#FFF1E6", "#D9C8F2", "#C7EAD6"],
  },
  {
    id: "luxury",
    label: "Luxury Pastel - Muted blush, champagne, sage, dusty lavender",
    colors: ["#E8C7C8", "#F6E7D8", "#C9D6CF", "#D8CCE8"],
  },
  {
    id: "korean",
    label: "Korean Pastel - Clean pink, sky blue, butter yellow, soft mint",
    colors: ["#F6C6D0", "#C9E4F6", "#F7E6A6", "#D7F0E1"],
  },
  {
    id: "baby",
    label: "Baby Pastel - Baby pink, baby blue, soft green, pale yellow",
    colors: ["#F8C8DC", "#BDE0FE", "#CDEAC0", "#FFF1B8"],
  },
  {
    id: "muted",
    label: "Muted Pastel - Dusty rose, muted sage, faded lilac, beige cream",
    colors: ["#D8A7B1", "#B7C9B5", "#C8BFD6", "#E8D8BF"],
  },
  {
    id: "warm",
    label: "Warm Pastel - Peach, apricot, warm blush, vanilla cream",
    colors: ["#F6C1A6", "#F9D7A8", "#F4B6B6", "#F8E6C8"],
  },
  {
    id: "cool",
    label: "Cool Pastel - Powder blue, aqua mint, pale lilac, ice blue",
    colors: ["#BFD7EA", "#C8E7E0", "#D7D2F0", "#D8EEF2"],
  },
  {
    id: "cotton_candy",
    label: "Cotton Candy - Candy pink, airy blue, sugar lilac, pale lemon",
    colors: ["#FFB7D5", "#BDE7FF", "#F8D1FF", "#FFF0B8"],
  },
  {
    id: "wedding",
    label: "Wedding Pastel - Rose veil, ivory, soft mauve, delicate sage",
    colors: ["#F3D6D8", "#FFF4E8", "#D8CDE8", "#DDE6D5"],
  },
  {
    id: "spring",
    label: "Spring Pastel - Tulip pink, fresh green, clear sky, butter yellow",
    colors: ["#F9C8C2", "#D9EEC7", "#C7E4F7", "#F9E7A7"],
  },
] as const;

const DARK_MOOD_PALETTES = [
  {
    id: "midnight_luxe",
    label:
      "Midnight Luxe - Midnight navy, deep indigo, plum shadow, muted gold, wine accent, champagne highlight",
    colors: ["#07111F", "#14213D", "#3A0F2F", "#C6A15B", "#7A1E3A", "#F0D8A8"],
  },
  {
    id: "jewel",
    label:
      "Jewel Dark - Black emerald, bottle green, royal aubergine, ruby wine, muted gold, soft champagne",
    colors: ["#071A16", "#0B3D2E", "#2B1458", "#7A1E3A", "#C6A15B", "#F0D8A8"],
  },
  {
    id: "charcoal_rose",
    label: "Charcoal Rose - Soft black, charcoal, deep rosewood, dusty berry, warm clay, blush cream",
    colors: ["#111111", "#2A2A2A", "#4A1F2D", "#8A4A58", "#D08A6A", "#F2D6C2"],
  },
  {
    id: "forest_noir",
    label: "Forest Noir - Black green, pine, moss shadow, antique olive, warm gold, wheat highlight",
    colors: ["#06110D", "#123225", "#30451C", "#6B5B2A", "#B08A4A", "#E8D6A8"],
  },
  {
    id: "aubergine_night",
    label: "Aubergine Night - Ink purple, aubergine, plum wine, muted mauve, copper accent, peach tan",
    colors: ["#140A18", "#2D1636", "#4B1E3D", "#6E3552", "#C47A3B", "#E7B98A"],
  },
  {
    id: "espresso_gold",
    label: "Espresso Gold - Espresso black, cacao, walnut, dull gold, saffron gold, warm cream",
    colors: ["#130D09", "#332015", "#5A3924", "#B08A4A", "#D99A3D", "#F0D8A8"],
  },
  {
    id: "ink_teal",
    label: "Ink Teal - Ink black, deep teal, oxidized blue, burnt copper, amber, warm sand",
    colors: ["#061417", "#0D2F35", "#14505A", "#A35F42", "#D99A3D", "#F2D6B3"],
  },
  {
    id: "gothic_floral",
    label: "Gothic Floral - Near black, blue charcoal, burgundy, dark crimson, terracotta blush, soft cream",
    colors: ["#09090B", "#1F2937", "#581C2D", "#8B2635", "#D89567", "#F2D6C2"],
  },
] as const;

const EARTHY_MOOD_PALETTES = [
  {
    id: "raw_sienna",
    label: "Raw Sienna - Sand dust, pale clay, raw sand, sienna, dark ochre, burnt umber",
    colors: ["#F8EED0", "#EED4B0", "#D4A870", "#C07030", "#8B4010", "#3C2A10"],
  },
  {
    id: "forest_bark",
    label: "Forest Bark - Pale lichen, sage mist, fern, moss, forest, dark bark",
    colors: ["#EEF0E8", "#D0D8C0", "#A0B080", "#608040", "#305010", "#1C2C10"],
  },
  {
    id: "desert_mesa",
    label: "Desert Mesa - Mesa cream, dune sand, sandstone, terracotta, red mesa, canyon dark",
    colors: ["#FAF0E4", "#F0D8B8", "#D8A870", "#B86830", "#804020", "#402010"],
  },
  {
    id: "walnut_grove",
    label: "Walnut Grove - Linen, warm sand, hazel, walnut, dark wood, ebony",
    colors: ["#F4EDE4", "#DCC8B0", "#B89770", "#885830", "#543418", "#281808"],
  },
  {
    id: "river_stone",
    label: "River Stone - Stone mist, pebble, gravel, river rock, boulder, dark stone",
    colors: ["#EEEAE4", "#D4CEC4", "#A8A090", "#786858", "#4C4030", "#242018"],
  },
  {
    id: "autumn_soil",
    label: "Autumn Soil - Autumn ice, fallen leaf, rust clay, autumn red, dark soil, root",
    colors: ["#F8EEE4", "#EED0A8", "#D49060", "#A85028", "#703018", "#381808"],
  },
  {
    id: "dry_grass",
    label: "Dry Grass - Straw ice, dry straw, prairie, dry grass, harvest, dark loam",
    colors: ["#F8F4E4", "#ECE4C0", "#D0C080", "#A89040", "#706018", "#343008"],
  },
  {
    id: "clay_pot",
    label: "Clay Pot - Fired cream, raw clay, fired clay, terracotta, pot dark, kiln black",
    colors: ["#FAEDEC", "#F0D4C4", "#D09878", "#B06040", "#783820", "#3A1C0C"],
  },
  {
    id: "mossy_log",
    label: "Mossy Log - Pale lichen, soft moss, moss green, deep moss, log green, bark dark",
    colors: ["#EEF2E8", "#D0DCC8", "#A0B080", "#608348", "#304920", "#1C2810"],
  },
  {
    id: "spice_market",
    label: "Spice Market - Cream spice, turmeric, saffron, cumin, paprika, clove",
    colors: ["#F8E8C8", "#E0AA40", "#D4A040", "#B07020", "#704010", "#3C2008"],
  },
  {
    id: "coastal_driftwood",
    label: "Coastal Driftwood - Bleached, driftwood, dune grass, kelp brown, tidal dark, washed black",
    colors: ["#F0EEE8", "#D8D4C4", "#B8A888", "#807058", "#504830", "#282418"],
  },
  {
    id: "volcanic_ash",
    label: "Volcanic Ash - Ash white, pale pumice, pumice, basalt, cinder, volcanic",
    colors: ["#F0EEE4", "#D4D0C4", "#A8A494", "#787060", "#484038", "#201C18"],
  },
] as const;

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "#000000";
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const upper = prefixed.toUpperCase();
  return /^#[0-9A-F]{3}$/i.test(upper)
    ? `#${upper.slice(1).split("").map((char) => char + char).join("")}`
    : upper;
};

const isValidHexColor = (value: string) => /^#([0-9A-F]{6}|[0-9A-F]{8})$/i.test(value.trim());

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

const getPresetCategoryTitle = (preset: PresetId) =>
  PRESET_CATEGORIES.find((category) => category.presets.some((item) => item.id === preset))?.title ||
  PRESET_CATEGORIES[0]?.title ||
  "";

const getBackendPreset = (preset: PresetId) => {
  if (preset === "dusty" || preset === "dark_dusty") return "dark_dusty";
  if (["fresh", "candy", "ice_cream", "kids"].includes(preset)) return "pastel";
  if (["home_decor", "home_furnishing", "wallpaper", "earthy"].includes(preset)) return "natural";
  if (preset === "dark" || preset.startsWith("dark_")) return "dark";
  return preset;
};

const getPresetSwatchBackground = (colors: string[]) => {
  if (colors.length <= 1) return colors[0] || "#f5f0e8";

  const step = 100 / colors.length;
  const stops = colors
    .map((color, index) => `${color} ${Math.round(index * step)}% ${Math.round((index + 1) * step)}%`)
    .join(", ");

  return `linear-gradient(135deg, ${stops})`;
};

const hexToRgb = (color: string) => {
  const normalized = normalizeHexColor(color);
  if (!isValidHexColor(normalized)) return null;
  const hex = normalized.slice(1, 7);

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

const mixHexColor = (color: string, target: "#000000" | "#FFFFFF", amount: number) => {
  const base = hexToRgb(color);
  const targetRgb = hexToRgb(target);
  if (!base || !targetRgb) return normalizeHexColor(color).slice(0, 7);

  return rgbToHex({
    r: base.r + (targetRgb.r - base.r) * amount,
    g: base.g + (targetRgb.g - base.g) * amount,
    b: base.b + (targetRgb.b - base.b) * amount,
  });
};

const getMonotoneTonalPalette = (baseColor: string) => {
  const normalizedBase = normalizeHexColor(baseColor).slice(0, 7);

  return [
    mixHexColor(normalizedBase, "#000000", 0.35),
    normalizedBase,
    mixHexColor(normalizedBase, "#FFFFFF", 0.35),
    mixHexColor(normalizedBase, "#FFFFFF", 0.65),
  ];
};

const extractOutputUrls = (data: GenerateResponse) => {
  const urls = [...(data.image_urls ?? []), ...(data.output_url ? [data.output_url] : [])]
    .map((url) => normalizeBackendImageUrl(resolveImageUrl(url)))
    .filter(Boolean);

  return Array.from(new Set(urls));
};

const getFriendlyError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : String(error || "Color matching request failed.");

  if (/network|connection|failed to fetch|ERR_CONNECTION_RESET|unavailable/i.test(message)) {
    return "AI color matching service is unavailable. Please try again in a moment.";
  }

  return message || "Color matching request failed.";
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#d8c5a8] bg-[#fffaf3] p-4 shadow-[0_24px_80px_rgba(76,53,25,0.08)] md:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8a6a47]">{title}</p>
      {description && <p className="mt-2 text-sm leading-6 text-[#685241]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#d7c4a9] bg-[#fffaf1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8a6a47]">
      {children}
    </span>
  );
}

function DetailCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#2f2924] bg-[#1d1713] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a18f79]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function ColorMatchingStudio() {
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("monotone");
  const [selectedShadeIndex, setSelectedShadeIndex] = useState(0);
  const [openCategory, setOpenCategory] = useState(getPresetCategoryTitle("monotone"));
  const [selectedPastelMoodId, setSelectedPastelMoodId] = useState(PASTEL_MOOD_PALETTES[0].id);
  const [selectedDarkMoodId, setSelectedDarkMoodId] = useState(DARK_MOOD_PALETTES[0].id);
  const [selectedEarthyMoodId, setSelectedEarthyMoodId] = useState(EARTHY_MOOD_PALETTES[0].id);
  const [customTargetColors, setCustomTargetColors] = useState<Partial<Record<PresetId, string>>>({});
  const [customHexInput, setCustomHexInput] = useState("#264F7A");
  const [customSubmittedPalettes, setCustomSubmittedPalettes] = useState<Partial<Record<PresetId, string[]>>>({});
  const [selectedColorPaletteIndex, setSelectedColorPaletteIndex] = useState<number | null>(null);
  const [editingColorPaletteIndex, setEditingColorPaletteIndex] = useState<number | null>(null);
  const [editingColorPaletteHex, setEditingColorPaletteHex] = useState("");
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
  const colorPalettePickerRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  const selectedPresetMeta = useMemo(() => getPresetMeta(selectedPreset), [selectedPreset]);
  const selectedPastelMood = useMemo(
    () => PASTEL_MOOD_PALETTES.find((mood) => mood.id === selectedPastelMoodId) ?? PASTEL_MOOD_PALETTES[0],
    [selectedPastelMoodId]
  );
  const selectedDarkMood = useMemo(
    () => DARK_MOOD_PALETTES.find((mood) => mood.id === selectedDarkMoodId) ?? DARK_MOOD_PALETTES[0],
    [selectedDarkMoodId]
  );
  const selectedEarthyMood = useMemo(
    () => EARTHY_MOOD_PALETTES.find((mood) => mood.id === selectedEarthyMoodId) ?? EARTHY_MOOD_PALETTES[0],
    [selectedEarthyMoodId]
  );
  const currentPalette = useMemo(() => {
    if (!selectedPresetMeta) return [];
    if (selectedPreset === "pastel") return [...selectedPastelMood.colors];
    if (selectedPreset === "dark") return [...selectedDarkMood.colors];
    if (selectedPreset === "earthy") return [...selectedEarthyMood.colors];
    return selectedPresetMeta.colors;
  }, [selectedDarkMood.colors, selectedEarthyMood.colors, selectedPastelMood.colors, selectedPreset, selectedPresetMeta]);
  const selectedSwatchColor = currentPalette[selectedShadeIndex] ?? currentPalette[0] ?? "#264F7A";
  const activePaletteColor = customTargetColors[selectedPreset] ?? selectedSwatchColor;
  const baseSubmittedPalette = useMemo(
    () => (selectedPreset === "monotone" ? getMonotoneTonalPalette(activePaletteColor) : currentPalette),
    [activePaletteColor, currentPalette, selectedPreset]
  );
  const submittedPalette = customSubmittedPalettes[selectedPreset] ?? baseSubmittedPalette;
  const selectedColorPaletteColor =
    selectedColorPaletteIndex !== null ? submittedPalette[selectedColorPaletteIndex] : "";
  const submittedPaletteLabel =
    selectedPreset === "monotone"
      ? "monotone tonal palette"
      : `${selectedPresetMeta?.id.replace(/_/g, " ") ?? "selected"} palette`;
  const selectedPresetCategoryTitle = useMemo(
    () => getPresetCategoryTitle(selectedPreset),
    [selectedPreset]
  );

  useEffect(() => {
    setOpenCategory(selectedPresetCategoryTitle);
  }, [selectedPresetCategoryTitle]);

  useEffect(() => {
    if (selectedShadeIndex >= currentPalette.length) {
      setSelectedShadeIndex(0);
    }
  }, [currentPalette.length, selectedShadeIndex]);

  useEffect(() => {
    setCustomHexInput(activePaletteColor);
  }, [activePaletteColor]);

  useEffect(() => {
    if (editingColorPaletteIndex === null) return;

    const selectedColor = submittedPalette[editingColorPaletteIndex];
    if (!selectedColor) {
      setEditingColorPaletteIndex(null);
      setEditingColorPaletteHex("");
      return;
    }

    setEditingColorPaletteHex(selectedColor);
  }, [editingColorPaletteIndex, submittedPalette]);

  useEffect(() => {
    if (resultUrls.length > 0 && !selectedResultUrl) {
      setSelectedResultUrl(resultUrls[0]);
    }
  }, [resultUrls, selectedResultUrl]);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  const clearResult = () => {
    setResultUrls([]);
    setSelectedResultUrl(null);
    setLastResponse(null);
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

  const handlePastelMoodChange = (moodId: string) => {
    const mood = PASTEL_MOOD_PALETTES.find((item) => item.id === moodId) ?? PASTEL_MOOD_PALETTES[0];

    setSelectedPastelMoodId(mood.id);
    setSelectedShadeIndex(0);
    setCustomHexInput(mood.colors[0]);
    setSelectedColorPaletteIndex(null);
    setEditingColorPaletteIndex(null);
    setEditingColorPaletteHex("");
    setCustomTargetColors((current) => {
      if (!current.pastel) return current;

      const next = { ...current };
      delete next.pastel;
      return next;
    });
    setCustomSubmittedPalettes((current) => {
      if (!current.pastel) return current;

      const next = { ...current };
      delete next.pastel;
      return next;
    });
  };

  const handleDarkMoodChange = (moodId: string) => {
    const mood = DARK_MOOD_PALETTES.find((item) => item.id === moodId) ?? DARK_MOOD_PALETTES[0];

    setSelectedDarkMoodId(mood.id);
    setSelectedShadeIndex(0);
    setCustomHexInput(mood.colors[0]);
    setSelectedColorPaletteIndex(null);
    setEditingColorPaletteIndex(null);
    setEditingColorPaletteHex("");
    setCustomTargetColors((current) => {
      if (!current.dark) return current;

      const next = { ...current };
      delete next.dark;
      return next;
    });
    setCustomSubmittedPalettes((current) => {
      if (!current.dark) return current;

      const next = { ...current };
      delete next.dark;
      return next;
    });
  };

  const handleEarthyMoodChange = (moodId: string) => {
    const mood = EARTHY_MOOD_PALETTES.find((item) => item.id === moodId) ?? EARTHY_MOOD_PALETTES[0];

    setSelectedEarthyMoodId(mood.id);
    setSelectedShadeIndex(0);
    setCustomHexInput(mood.colors[0]);
    setSelectedColorPaletteIndex(null);
    setEditingColorPaletteIndex(null);
    setEditingColorPaletteHex("");
    setCustomTargetColors((current) => {
      if (!current.earthy) return current;

      const next = { ...current };
      delete next.earthy;
      return next;
    });
    setCustomSubmittedPalettes((current) => {
      if (!current.earthy) return current;

      const next = { ...current };
      delete next.earthy;
      return next;
    });
  };

  const resetSubmittedPaletteOverride = () => {
    setCustomSubmittedPalettes((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
      return next;
    });
    setSelectedColorPaletteIndex(null);
    setEditingColorPaletteIndex(null);
    setEditingColorPaletteHex("");
  };

  const selectPaletteShade = (index: number, color: string) => {
    const nextColor = normalizeHexColor(color).slice(0, 7);

    setSelectedShadeIndex(index);
    setCustomHexInput(nextColor);
    resetSubmittedPaletteOverride();
    setCustomTargetColors((current) => ({
      ...current,
      [selectedPreset]: nextColor,
    }));
  };

  const updateCustomTargetColor = (value: string) => {
    setCustomHexInput(value.toUpperCase());

    const nextColor = normalizeHexColor(value);
    if (!isValidHexColor(nextColor)) return;

    resetSubmittedPaletteOverride();
    setCustomTargetColors((current) => ({
      ...current,
      [selectedPreset]: nextColor.slice(0, 7),
    }));
  };

  const settleCustomTargetColor = () => {
    const nextColor = normalizeHexColor(customHexInput);

    if (!isValidHexColor(nextColor)) {
      setCustomHexInput(activePaletteColor);
      return;
    }

    setCustomHexInput(nextColor.slice(0, 7));
  };

  const selectSubmittedPaletteColor = (index: number) => {
    setSelectedColorPaletteIndex(index);
    setEditingColorPaletteIndex(null);
    window.requestAnimationFrame(() => {
      colorPalettePickerRef.current?.click();
    });
  };

  const editSubmittedPaletteHex = (index: number, color: string) => {
    setSelectedColorPaletteIndex(index);
    setEditingColorPaletteIndex(index);
    setEditingColorPaletteHex(color);
  };

  const updateSubmittedPaletteColor = (value: string) => {
    if (selectedColorPaletteIndex === null) return;

    const nextColor = normalizeHexColor(value);
    if (!isValidHexColor(nextColor)) return;

    setCustomSubmittedPalettes((current) => {
      const existing = current[selectedPreset] ?? submittedPalette;
      const nextPalette = existing.map((color, index) =>
        index === selectedColorPaletteIndex ? nextColor.slice(0, 7) : color
      );

      return {
        ...current,
        [selectedPreset]: nextPalette,
      };
    });
  };

  const updateSubmittedPaletteHex = (value: string) => {
    setEditingColorPaletteHex(value.toUpperCase());

    if (editingColorPaletteIndex === null) return;

    const nextColor = normalizeHexColor(value);
    if (!isValidHexColor(nextColor)) return;

    setSelectedColorPaletteIndex(editingColorPaletteIndex);
    setCustomSubmittedPalettes((current) => {
      const existing = current[selectedPreset] ?? submittedPalette;
      const nextPalette = existing.map((color, index) =>
        index === editingColorPaletteIndex ? nextColor.slice(0, 7) : color
      );

      return {
        ...current,
        [selectedPreset]: nextPalette,
      };
    });
  };

  const settleSubmittedPaletteHex = () => {
    if (editingColorPaletteIndex === null) return;

    const nextColor = normalizeHexColor(editingColorPaletteHex);

    if (!isValidHexColor(nextColor)) {
      setEditingColorPaletteHex(submittedPalette[editingColorPaletteIndex] ?? "");
      return;
    }

    setEditingColorPaletteHex(nextColor.slice(0, 7));
  };

  const buildFormData = () => {
    if (!selectedFile) {
      throw new Error("Please upload a textile image first.");
    }

    const form = new FormData();
    form.append("file", selectedFile);
    form.append("color_preset", getBackendPreset(selectedPreset));
    form.append("target_color", activePaletteColor);
    form.append("color_palette", submittedPalette.join(", "));
    form.append("num_images", "1");
    form.append("enhance_prompt", "false");

    return form;
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setStatus("Please upload an image first.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setStatus("Generating preset match...");
      clearResult();

      const response = await generateImage(buildFormData());
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
    const resolvedUrl = normalizeBackendImageUrl(resolveImageUrl(url));
    const response = await fetch(resolvedUrl);
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

  const handleReuseGeneratedImage = async (url: string) => {
    const resolvedUrl = normalizeBackendImageUrl(resolveImageUrl(url));
    const response = await fetch(resolvedUrl);
    const blob = await response.blob();
    const file = new File([blob], `reused-textile-${Date.now()}.png`, {
      type: blob.type || "image/png",
    });

    handleFileSelection(file);
    setStatus("Generated image reused as the new input.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ecdf] text-[#241b15]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[#d69a6a]/20 blur-[150px]" />
        <div className="absolute right-[-12%] top-[6%] h-[420px] w-[420px] rounded-full bg-[#e11d2e]/8 blur-[150px]" />
        <div className="absolute bottom-[-12%] left-[16%] h-[360px] w-[360px] rounded-full bg-[#9aa899]/18 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(129,96,58,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(129,96,58,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.18]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <header className="flex flex-col gap-5 border-b border-[#d8c5a8] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7c4a9] bg-[#fffaf1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8d6a43]">
              <Sparkles className="h-3.5 w-3.5 text-[#e11d2e]" />
              RDC AI Studio / Color Matching
            </div>
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1d1712] md:text-6xl">
                AI Color Matching Studio
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#685241] md:text-base">
                Preset-only studio for textile recoloring. Pick a palette, adjust the swatches, and generate.
              </p>
              <p className="mt-3 inline-flex rounded-full border border-[#d7c4a9] bg-[#fffaf1] px-3 py-1 text-[11px] font-medium text-[#8a6a47]">
                All advanced and background controls removed as requested.
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

        <main className="grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
          <section className="space-y-5">
            <SectionCard
              title="01 - Upload"
              description="Drop a source textile image here. A mask is not required for preset matching."
            >
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
                className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-5 text-center transition ${
                  isDragOver ? "border-[#e11d2e] bg-[#f9e5e5]" : "border-[#d4c0a0] bg-[#f7efe3]"
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
                      <Upload className="h-6 w-6" />
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
            </SectionCard>

            <SectionCard
              title="02 - Quick Presets"
              description="Select a preset and tweak individual swatches if needed."
            >
              <div className="space-y-3">
                {PRESET_CATEGORIES.map((category) => {
                  const isOpen = openCategory === category.title;
                  const isSelectedCategory = category.presets.some((preset) => preset.id === selectedPreset);

                  return (
                    <div key={category.title} className="overflow-hidden rounded-lg border border-[#d4c8b6] bg-[#f6efe3] p-1">
                      <button
                        type="button"
                        onClick={() => setOpenCategory((current) => (current === category.title ? "" : category.title))}
                        className="flex w-full items-center justify-between gap-3 px-2 py-1 text-left transition hover:bg-[#efe4d3]"
                      >
                        <span className="font-serif text-[12px] font-bold uppercase text-[#1d1712]">
                          {category.title}
                        </span>
                        <ChevronDown
                          className={`h-3 w-3 text-[#9a8467] transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-1 pb-1">
                          <div className="grid grid-cols-2 gap-2">
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
                                  className={`flex min-h-[60px] flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition ${
                                    active
                                      ? "border-[#9e702f] bg-[#fff8ea] shadow-[0_0_0_1px_rgba(158,112,47,0.18)]"
                                      : "border-[#d6c7ad] bg-[#fffdf8] hover:border-[#b48a56]"
                                  }`}
                                >
                                  <span
                                    className="h-7 w-7 rounded-full border border-black/10 shadow-sm"
                                    style={{ background: getPresetSwatchBackground(preset.colors) }}
                                  />
                                  <span className="mt-1 font-serif text-[11px] font-semibold text-[#241b15]">
                                    {preset.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {isSelectedCategory && (
                            <div className="mt-2 rounded-md border border-[#d6c7ad] bg-[#fffaf6] p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-serif text-sm font-semibold text-[#241b15]">
                                    {selectedPresetMeta?.label ?? "Monotone"}
                                  </p>
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#9a8467]">
                                    {activePaletteColor}
                                  </p>
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.18em] text-[#9a8467]">
                                  color_palette
                                </span>
                              </div>

                              {selectedPreset === "pastel" && (
                                <div className="mt-3 rounded-md border border-[#d8c6a7] bg-[#fbf4ea] p-3">
                                  <p className="font-serif text-sm font-semibold text-[#241b15]">Pastel Palette</p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#8a7662]">
                                    Only colors will change. Pattern, layout, and print details stay preserved.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="font-serif text-xs text-[#241b15]">Start from mood</span>
                                    <select
                                      value={selectedPastelMoodId}
                                      onChange={(event) => handlePastelMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-[#caa87b] bg-white px-3 text-sm text-[#241b15] outline-none transition focus:border-[#8b622e]"
                                      aria-label="Select pastel mood"
                                    >
                                      {PASTEL_MOOD_PALETTES.map((mood) => (
                                        <option key={mood.id} value={mood.id}>
                                          {mood.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              )}

                              {selectedPreset === "dark" && (
                                <div className="mt-3 rounded-md border border-[#d8c6a7] bg-[#fbf4ea] p-3">
                                  <p className="font-serif text-sm font-semibold text-[#241b15]">Dark Palette</p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#8a7662]">
                                    Choose a predefined dark mood, or tune the palette colors manually.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="font-serif text-xs text-[#241b15]">Start from mood</span>
                                    <select
                                      value={selectedDarkMoodId}
                                      onChange={(event) => handleDarkMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-[#caa87b] bg-white px-3 text-sm text-[#241b15] outline-none transition focus:border-[#8b622e]"
                                      aria-label="Select dark mood"
                                    >
                                      {DARK_MOOD_PALETTES.map((mood) => (
                                        <option key={mood.id} value={mood.id}>
                                          {mood.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              )}

                              {selectedPreset === "earthy" && (
                                <div className="mt-3 rounded-md border border-[#d8c6a7] bg-[#fbf4ea] p-3">
                                  <p className="font-serif text-sm font-semibold text-[#241b15]">Earthy Palette</p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#8a7662]">
                                    Choose an earthy light-base mood with natural contrast colors, or tune the palette manually.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="font-serif text-xs text-[#241b15]">Start from mood</span>
                                    <select
                                      value={selectedEarthyMoodId}
                                      onChange={(event) => handleEarthyMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-[#caa87b] bg-white px-3 text-sm text-[#241b15] outline-none transition focus:border-[#8b622e]"
                                      aria-label="Select earthy mood"
                                    >
                                      {EARTHY_MOOD_PALETTES.map((mood) => (
                                        <option key={mood.id} value={mood.id}>
                                          {mood.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              )}

                              <div
                                className="mt-3 grid gap-2"
                                style={{
                                  gridTemplateColumns: `repeat(${currentPalette.length}, minmax(0, 1fr))`,
                                }}
                              >
                                {currentPalette.map((color, index) => (
                                  <button
                                    key={`${selectedPreset}-sub-swatch-${index}`}
                                    type="button"
                                    onClick={() => selectPaletteShade(index, color)}
                                    className={`h-12 rounded-md border transition ${
                                      selectedShadeIndex === index
                                        ? "border-[#8b622e] shadow-[0_0_0_2px_rgba(139,98,46,0.18)]"
                                        : "border-[#d8c6a7] hover:border-[#b48a56]"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select shade ${index + 1}`}
                                  />
                                ))}
                              </div>

                              {!["pastel", "dark", "earthy"].includes(selectedPreset) && (
                                <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_44px_auto] items-center gap-2">
                                  <span className="font-serif text-xs leading-4 text-[#241b15]">Custom color</span>

                                  <input
                                    type="text"
                                    value={customHexInput}
                                    onChange={(event) => updateCustomTargetColor(event.target.value)}
                                    onBlur={settleCustomTargetColor}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.currentTarget.blur();
                                      }
                                    }}
                                    placeholder="#3A3A3A"
                                    className="h-9 min-w-0 rounded-md border border-[#d8c6a7] bg-[#fffdf9] px-3 text-sm font-semibold uppercase text-[#241b15] outline-none transition focus:border-[#8b622e]"
                                    aria-label="Custom color hex"
                                  />

                                  <input
                                    type="color"
                                    value={isValidHexColor(activePaletteColor) ? activePaletteColor.slice(0, 7) : "#000000"}
                                    onChange={(event) => updateCustomTargetColor(event.target.value)}
                                    className="h-9 w-11 cursor-pointer rounded-md border border-[#d8c6a7] bg-white p-1"
                                    aria-label="Pick custom color"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => void handleGenerate()}
                                    disabled={!selectedFile || isGenerating}
                                    className="inline-flex h-9 items-center justify-center rounded-md bg-[#8b622e] px-3 text-xs font-semibold text-white transition hover:bg-[#a77439] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isGenerating ? "Generating" : "Generate"}
                                  </button>
                                </div>
                              )}

                              <div className="mt-3 rounded-md border border-[#d8c6a7] bg-white p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-serif text-sm font-semibold text-[#241b15]">
                                    {selectedPreset === "dark"
                                      ? "Your Dark Colors"
                                      : selectedPreset === "earthy"
                                        ? "Your Earthy Colors"
                                      : `Your ${selectedPresetMeta?.label ?? "Preset"} Palette`}
                                  </p>
                                  <span className="text-[9px] uppercase tracking-[0.16em] text-[#9a8467]">
                                    color_palette
                                  </span>
                                </div>
                                <div
                                  className="mt-3 grid gap-2"
                                  style={{
                                    gridTemplateColumns: `repeat(${submittedPalette.length}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {submittedPalette.map((color, index) => (
                                    <button
                                      key={`${selectedPreset}-your-palette-${index}`}
                                      type="button"
                                      onClick={() => selectSubmittedPaletteColor(index)}
                                      className={`h-7 rounded-sm border transition ${
                                        selectedColorPaletteIndex === index
                                          ? "border-[#8b622e] shadow-[0_0_0_2px_rgba(139,98,46,0.18)]"
                                          : "border-[#d8c6a7] hover:border-[#b48a56]"
                                      }`}
                                      style={{ backgroundColor: color }}
                                      aria-label={`Edit color palette shade ${index + 1}`}
                                    />
                                  ))}
                                </div>
                                <div
                                  className="mt-2 grid gap-2"
                                  style={{
                                    gridTemplateColumns: `repeat(${submittedPalette.length}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {submittedPalette.map((color, index) =>
                                    editingColorPaletteIndex === index ? (
                                      <input
                                        key={`${selectedPreset}-your-palette-code-${index}`}
                                        type="text"
                                        value={editingColorPaletteHex}
                                        onChange={(event) => updateSubmittedPaletteHex(event.target.value)}
                                        onBlur={settleSubmittedPaletteHex}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.currentTarget.blur();
                                          }
                                        }}
                                        className="h-[26px] min-w-0 rounded-sm border border-[#8b622e] bg-white px-1 py-1 text-center text-[10px] font-semibold uppercase text-[#241b15] outline-none"
                                        aria-label={`Edit color palette hex ${index + 1}`}
                                        autoFocus
                                      />
                                    ) : (
                                      <button
                                        key={`${selectedPreset}-your-palette-code-${index}`}
                                        type="button"
                                        onClick={() => editSubmittedPaletteHex(index, color)}
                                        className={`truncate rounded-sm border px-1 py-1 text-center text-[10px] font-semibold uppercase text-[#241b15] transition ${
                                          selectedColorPaletteIndex === index
                                            ? "border-[#8b622e] bg-[#f7ebd6]"
                                            : "border-[#e4d8c7] bg-[#fffaf3] hover:border-[#b48a56]"
                                        }`}
                                      >
                                        {color}
                                      </button>
                                    )
                                  )}
                                </div>
                                <input
                                  ref={colorPalettePickerRef}
                                  type="color"
                                  value={
                                    isValidHexColor(selectedColorPaletteColor)
                                      ? selectedColorPaletteColor.slice(0, 7)
                                      : "#000000"
                                  }
                                  onChange={(event) => updateSubmittedPaletteColor(event.target.value)}
                                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                                  tabIndex={-1}
                                  aria-hidden="true"
                                />
                                <p className="mt-3 text-[10px] leading-5 text-[#6f5b49]">
                                  {submittedPaletteLabel}: {submittedPalette.join(", ")}
                                </p>
                                <p className="mt-2 text-[10px] leading-5 text-[#8a7662]">
                                  {selectedPreset === "monotone"
                                    ? "Base color is sent as target_color. Tonal shades are sent in color_palette."
                                    : "Selected shades are sent in color_palette."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </section>

          <section className="space-y-5">
            <div className="rounded-[30px] border border-[#2c2622] bg-[#181210] p-5 text-[#f7f2ea] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#b49b7a]">
                    <Palette className="h-4 w-4 text-[#e11d2d]" />
                    Results
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {selectedFile ? "Preview and outputs" : "Upload an image to begin"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#9a8d7b]">{status}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <MiniBadge>Preset Mode</MiniBadge>
                  {selectedPresetMeta?.label && <MiniBadge>{selectedPresetMeta.label}</MiniBadge>}
                  {lastResponse?.model && <MiniBadge>{lastResponse.model}</MiniBadge>}
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
                          <ImageIcon className="mx-auto h-10 w-10 text-[#e11d2d]" />
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleReuseGeneratedImage(selectedResultUrl)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d7c4a9] transition hover:border-[#e11d2e]/35 hover:text-white"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Use as Input
                        </button>
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
                      </div>
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
                            {selectedPresetMeta?.label ?? "Custom"}
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
              <DetailCard label="Target Color" value={activePaletteColor} />
              <DetailCard label="Palette" value={submittedPalette.join(" - ")} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
