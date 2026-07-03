import { useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  ImageUp,
  Loader2,
  RefreshCcw,
  Scissors,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";

type TabId = "cultural" | "technique" | "stitches" | "specialty";
type SelectionCategory = "cultural" | "technique" | "stitch" | "specialty";

type StyleOption = {
  value: string;
  title: string;
  code: string;
  description: string;
  category: SelectionCategory;
  accent: string;
};

type Guide = {
  title: string;
  description: string;
  fabric: string;
  stitches: string;
  motifs: string;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
} | null;

const styleTabs: Array<{ id: TabId; label: string }> = [
  { id: "cultural", label: "Cultural" },
  { id: "technique", label: "Technique" },
  { id: "stitches", label: "Stitches" },
  { id: "specialty", label: "Specialty" },
];

const culturalOptions: StyleOption[] = [
  {
    value: "sashiko",
    title: "Sashiko",
    code: "JAP",
    description: "White running stitch geometric grids on indigo blue fabric.",
    category: "cultural",
    accent: "#3B82F6",
  },
  {
    value: "kantha",
    title: "Kantha",
    code: "IND",
    description: "Organic running stitches filling motifs on layered soft fabrics.",
    category: "cultural",
    accent: "#F97316",
  },
  {
    value: "zardozi",
    title: "Zardozi",
    code: "IND",
    description: "Heavy gold and silver wire beadwork on velvet.",
    category: "cultural",
    accent: "#F59E0B",
  },
  {
    value: "phulkari",
    title: "Phulkari",
    code: "IND",
    description: "Vibrant silk floss geometric floral tiles on rough cotton.",
    category: "cultural",
    accent: "#E11D2E",
  },
  {
    value: "chikankari",
    title: "Chikankari",
    code: "IND",
    description: "Delicate white-on-white shadow embroidery and knots.",
    category: "cultural",
    accent: "#E5E7EB",
  },
  {
    value: "suzhou",
    title: "Suzhou Silk",
    code: "CHN",
    description: "Ultra-fine double-sided pictorial satin stitch artwork.",
    category: "cultural",
    accent: "#14B8A6",
  },
  {
    value: "nuido",
    title: "Nuido",
    code: "JAP",
    description: "Detailed silk pictorial hand embroidery with metallic accents.",
    category: "cultural",
    accent: "#A855F7",
  },
  {
    value: "otomi",
    title: "Otomi",
    code: "MEX",
    description: "Bright folk animals and florals on rustic muslin.",
    category: "cultural",
    accent: "#EC4899",
  },
  {
    value: "kalocsa",
    title: "Kalocsa",
    code: "HUN",
    description: "Colorful Hungarian floral folk art on white or black base.",
    category: "cultural",
    accent: "#EF4444",
  },
  {
    value: "hardanger-scand",
    title: "Hardanger",
    code: "SCA",
    description: "Counted satin blocks with delicate cutwork grids.",
    category: "cultural",
    accent: "#94A3B8",
  },
  {
    value: "tatreez",
    title: "Tatreez",
    code: "PAL",
    description: "Geometric cross-stitch symbols forming heritage motifs.",
    category: "cultural",
    accent: "#DC2626",
  },
  {
    value: "mountmellick",
    title: "Mountmellick",
    code: "UK",
    description: "Textured white-on-white nature motifs on heavy cotton.",
    category: "cultural",
    accent: "#F8FAFC",
  },
];

const techniqueOptions: StyleOption[] = [
  {
    value: "hand",
    title: "Hand Embroidery",
    code: "H",
    description: "Organic stitch tension with artisanal variation.",
    category: "technique",
    accent: "#E11D2E",
  },
  {
    value: "machine-flat",
    title: "Flat Machine",
    code: "M",
    description: "Uniform industrial satin fills and tight outlines.",
    category: "technique",
    accent: "#14B8A6",
  },
  {
    value: "machine-3d-puff",
    title: "3D Puff Machine",
    code: "3D",
    description: "Raised foam-backed satin stitches for puffy relief.",
    category: "technique",
    accent: "#F97316",
  },
  {
    value: "machine-applique",
    title: "Machine Applique",
    code: "AP",
    description: "Fabric patches secured with bold satin stitch borders.",
    category: "technique",
    accent: "#22C55E",
  },
];

const stitchOptions: StyleOption[] = [
  {
    value: "none",
    title: "No Extra Stitch",
    code: "OFF",
    description: "Let the selected origin define the stitch structure.",
    category: "stitch",
    accent: "#6B7280",
  },
  {
    value: "satin-stitch",
    title: "Satin Stitch",
    code: "S",
    description: "Parallel flat stitches for smooth glossy surfaces.",
    category: "stitch",
    accent: "#3B82F6",
  },
  {
    value: "chain-stitch",
    title: "Chain Stitch",
    code: "C",
    description: "Interlocking loop stitches forming rope-like lines.",
    category: "stitch",
    accent: "#14B8A6",
  },
  {
    value: "feather-stitch",
    title: "Feather Stitch",
    code: "F",
    description: "Open branching zig-zag decorative line work.",
    category: "stitch",
    accent: "#F97316",
  },
  {
    value: "fly-stitch",
    title: "Fly Stitch",
    code: "Y",
    description: "V-shaped loops anchored by a straight tail lock.",
    category: "stitch",
    accent: "#22C55E",
  },
  {
    value: "bullion-knot",
    title: "Bullion Knot",
    code: "K",
    description: "Raised cylindrical coils for dimensional thread bars.",
    category: "stitch",
    accent: "#A855F7",
  },
  {
    value: "french-knot",
    title: "French Knot",
    code: "FK",
    description: "Raised seed-like dots for granular texture.",
    category: "stitch",
    accent: "#EC4899",
  },
];

const specialtyOptions: StyleOption[] = [
  {
    value: "none",
    title: "No Specialty",
    code: "OFF",
    description: "Keep the output focused on selected origin and stitch.",
    category: "specialty",
    accent: "#6B7280",
  },
  {
    value: "ribbon",
    title: "Ribbon Embroidery",
    code: "R",
    description: "Silk ribbon loops for dimensional petals and leaves.",
    category: "specialty",
    accent: "#EC4899",
  },
  {
    value: "punch-needle",
    title: "Punch Needle",
    code: "P",
    description: "Dense loop-pile yarn texture with soft raised surfaces.",
    category: "specialty",
    accent: "#F97316",
  },
  {
    value: "tufting",
    title: "Tufting",
    code: "T",
    description: "Cut pile texture with miniature rug-like depth.",
    category: "specialty",
    accent: "#22C55E",
  },
  {
    value: "applique",
    title: "Hand Applique",
    code: "AP",
    description: "Layered fabric pieces sewn onto the base cloth.",
    category: "specialty",
    accent: "#3B82F6",
  },
  {
    value: "shadow-work",
    title: "Shadow Work",
    code: "SW",
    description: "Reverse-side stitching visible through translucent fabric.",
    category: "specialty",
    accent: "#A855F7",
  },
];

const classicOptions: StyleOption[] = [
  {
    value: "cross-stitch",
    title: "Classic Cross-Stitch",
    code: "X",
    description: "X-shaped stitches forming grids on even-weave Aida.",
    category: "cultural",
    accent: "#3B82F6",
  },
  {
    value: "crewel",
    title: "Classic Crewel",
    code: "C",
    description: "Wool yarn stitched on linen with natural motifs.",
    category: "cultural",
    accent: "#22C55E",
  },
  {
    value: "needlepoint",
    title: "Needlepoint",
    code: "N",
    description: "Dense diagonal stitches completely covering canvas.",
    category: "cultural",
    accent: "#F97316",
  },
  {
    value: "blackwork",
    title: "Blackwork",
    code: "B",
    description: "Fine black geometric fills on white linen.",
    category: "cultural",
    accent: "#374151",
  },
  {
    value: "goldwork",
    title: "Goldwork",
    code: "G",
    description: "Metallic threads couched on luxurious fabrics.",
    category: "cultural",
    accent: "#F59E0B",
  },
  {
    value: "stumpwork",
    title: "Stumpwork",
    code: "S",
    description: "Raised wired or padded elements off the fabric.",
    category: "cultural",
    accent: "#A855F7",
  },
  {
    value: "smocking",
    title: "Smocking",
    code: "SM",
    description: "Decorative stitching across gathered vertical pleats.",
    category: "cultural",
    accent: "#EC4899",
  },
];

const guideMap: Record<string, Guide> = {
  sashiko: {
    title: "Japanese Sashiko",
    description:
      "Traditional Japanese folk embroidery using even running stitches to create quiet geometric rhythm.",
    fabric: "Indigo-dyed coarse cotton canvas",
    stitches: "Evenly spaced running stitches",
    motifs: "Seigaiha waves, hemp leaves, interlocking grids",
  },
  kantha: {
    title: "Indian Kantha",
    description:
      "Bengal hand embroidery where running stitches travel across layered cloth with a soft wavy surface.",
    fabric: "Soft cotton, linen, or layered muslin",
    stitches: "Dense running stitch and darning stitch",
    motifs: "Birds, fish, lotus, daily village scenes",
  },
  zardozi: {
    title: "Indian Zardozi",
    description:
      "Persian-origin metal embroidery with opulent gold, silver, sequins, beads, and padded relief.",
    fabric: "Heavy royal velvet or satin silk",
    stitches: "Couching and padding relief stitching",
    motifs: "Paisley, royal floral crests, ornate borders",
  },
  phulkari: {
    title: "Punjabi Phulkari",
    description:
      "Bright silk floss embroidery from Punjab, built from dense darning stitches and floral geometry.",
    fabric: "Coarse khaddar cotton or heavy muslin",
    stitches: "Long darning stitch and satin stitch",
    motifs: "Flower tiles, geometric layouts, symmetrical grids",
  },
  chikankari: {
    title: "Lucknow Chikankari",
    description:
      "Refined white-on-white embroidery with shadow work, openwork and delicate floral details.",
    fabric: "Sheer muslin, organza, or fine linen",
    stitches: "Shadow herringbone, French knots, openwork",
    motifs: "Paisleys, jasmine buds, delicate creepers",
  },
  suzhou: {
    title: "Chinese Suzhou Silk",
    description:
      "Fine silk embroidery that renders pictorial surfaces with painterly thread direction and sheen.",
    fabric: "Smooth luxury silk fabric",
    stitches: "Fine satin stitch and randomized directional stitch",
    motifs: "Birds, blossoms, goldfish, landscapes",
  },
  nuido: {
    title: "Japanese Nuido",
    description:
      "Disciplined silk embroidery with layered sheen, metallic foil, and seasonal pictorial craft.",
    fabric: "Flat luxury silk weave",
    stitches: "Layered satin stitch and couching",
    motifs: "Cranes, dragons, bamboo, pine, landscapes",
  },
  otomi: {
    title: "Mexican Otomi",
    description:
      "Bold folk embroidery with expressive flora and fauna filled with bright flat stitches.",
    fabric: "Rustic muslin, coarse linen, or cotton canvas",
    stitches: "Closed herringbone and satin stitch",
    motifs: "Birds, deer, rabbits, giant flowers",
  },
  kalocsa: {
    title: "Hungarian Kalocsa",
    description:
      "Colorful floral folk embroidery traditionally stitched with vivid mercerized cotton threads.",
    fabric: "White or black linen and cotton weave",
    stitches: "Satin stitch and richelieu cutwork",
    motifs: "Roses, paprika peppers, lilacs, forget-me-nots",
  },
  "hardanger-scand": {
    title: "Scandinavian Hardanger",
    description:
      "Counted-thread openwork from Norway with satin blocks and carefully cut grid openings.",
    fabric: "Even-weave linen or cotton cloth",
    stitches: "Kloster blocks and woven bars",
    motifs: "Squares, diamonds, stars, lace grids",
  },
  tatreez: {
    title: "Palestinian Tatreez",
    description:
      "Counted cross-stitch heritage work using geometric symbols and garment panel layouts.",
    fabric: "Black or white even-weave cotton",
    stitches: "Counted cross-stitch",
    motifs: "Cypress trees, feathers, amulets, roses",
  },
  mountmellick: {
    title: "UK Mountmellick",
    description:
      "Textured whitework from Ireland using matte cotton thread and bold raised botanical forms.",
    fabric: "Thick white cotton jean or drill",
    stitches: "Mountmellick stitch, cable stitch, French knots",
    motifs: "Oak leaves, acorns, ivy, wheat, native plants",
  },
  "satin-stitch": {
    title: "Satin Stitch",
    description: "Flat parallel stitches laid close together to cover shapes with a smooth gloss.",
    fabric: "Works across cotton, silk, canvas, and velvet",
    stitches: "Parallel satin fill with directional sheen",
    motifs: "Petals, leaves, monograms, filled shapes",
  },
  "chain-stitch": {
    title: "Chain Stitch",
    description: "Looped stitches link together to create rope-like lines and expressive curves.",
    fabric: "Cotton, linen, denim, and wool grounds",
    stitches: "Interlocking chain loops",
    motifs: "Line art, vines, borders, concentric fills",
  },
  ribbon: {
    title: "Ribbon Embroidery",
    description: "Soft silk ribbons are folded and looped into raised floral forms.",
    fabric: "Silk, linen, organza, and velvet",
    stitches: "Ribbon stitch, looped petals, folded leaves",
    motifs: "Roses, peonies, bows, dimensional florals",
  },
  "punch-needle": {
    title: "Punch Needle Work",
    description: "Yarn loops are punched into cloth to create a soft pile texture.",
    fabric: "Monk cloth, linen, or sturdy weave",
    stitches: "Loop pile and dense punched rows",
    motifs: "Bold icons, rugs, fuzzy patches",
  },
};

const tabOptions: Record<TabId, StyleOption[]> = {
  cultural: culturalOptions,
  technique: techniqueOptions,
  stitches: [...classicOptions, ...stitchOptions],
  specialty: specialtyOptions,
};

const fabricOptions = [
  "original",
  "coarse indigo-dyed cotton canvas",
  "raw rustic linen fabric",
  "deep rich royal velvet fabric",
  "heavy weave cotton canvas",
  "sheer semi-transparent fabric",
  "smooth luxury silk fabric",
  "even-weave Aida cloth",
  "tightly pleated cotton cloth",
];

const densityOptions = [
  "fine and delicate",
  "dense and heavily stitched",
  "coarse and rustic spacing",
  "complex multi-layered depth",
];

const thicknessOptions = [
  "standard fine embroidery floss",
  "heavy corded yarn",
  "thick organic crewel wool thread",
  "fine gold purl and metallic wires",
];

const presetSvgs: Record<string, string> = {
  sashiko: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#0a1128"/><g stroke="#e0f2fe" stroke-width="5" fill="none" stroke-dasharray="9 8" opacity=".92"><path d="M-40 130a100 100 0 0 1 200 0M160 130a100 100 0 0 1 200 0M360 130a100 100 0 0 1 200 0"/><path d="M-40 130a70 70 0 0 1 200 0M160 130a70 70 0 0 1 200 0M360 130a70 70 0 0 1 200 0"/><path d="M-140 280a100 100 0 0 1 200 0M60 280a100 100 0 0 1 200 0M260 280a100 100 0 0 1 200 0M460 280a100 100 0 0 1 200 0"/><path d="M-140 280a70 70 0 0 1 200 0M60 280a70 70 0 0 1 200 0M260 280a70 70 0 0 1 200 0M460 280a70 70 0 0 1 200 0"/><path d="M-40 430a100 100 0 0 1 200 0M160 430a100 100 0 0 1 200 0M360 430a100 100 0 0 1 200 0"/><path d="M-40 430a70 70 0 0 1 200 0M160 430a70 70 0 0 1 200 0M360 430a70 70 0 0 1 200 0"/></g></svg>`,
  otomi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#fff7ed"/><g transform="translate(300 300)"><path d="M-90-20c-55-55-15-120 45-105 28 7 44 30 58 55 45-20 105-8 130 35 13 23 0 46-28 47-38 2-58 27-78 57-24 35-75 49-115 23-35-23-43-68-12-112z" fill="#ec4899"/><path d="M15-72c38-72 98-66 139-86-4 56-56 102-126 112z" fill="#f97316"/><path d="M-110 24c-60 68-118 56-145 18 52-22 98-31 151-23z" fill="#06b6d4"/><circle cx="142" cy="122" r="43" fill="#a855f7"/><path d="M142 62c34 43 34 79 0 122-34-43-34-79 0-122z" fill="#fbbf24"/><circle cx="-133" cy="-126" r="33" fill="#ef4444"/></g></svg>`,
  zardozi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#17051e"/><g transform="translate(300 300)" fill="none"><circle r="228" stroke="#d97706" stroke-width="16"/><circle r="196" stroke="#fbbf24" stroke-width="5" stroke-dasharray="13 10"/><path d="M0-136c-86 34-119 116-71 190 34 54 108 54 142 0 48-74 15-156-71-190z" stroke="#f59e0b" stroke-width="10"/><path d="M0-72c28 50 28 93 0 130-28-37-28-80 0-130z" fill="#fbbf24"/><g fill="#f59e0b" stroke="#fff7ed" stroke-width="3"><circle cx="-150" cy="-105" r="13"/><circle cx="150" cy="-105" r="13"/><circle cx="-150" cy="105" r="13"/><circle cx="150" cy="105" r="13"/></g></g></svg>`,
};

const formatValue = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveEmbroideryApiUrl = () => {
  const envBase = trimTrailingSlash(import.meta.env.VITE_EMBROIDERY_SERVICE_URL || "");
  if (envBase) return `${envBase}/api/embroidery-preview`;
  if (import.meta.env.DEV) return "/api/embroidery-preview";
  return "https://ruchitadesigncompany.in/api/embroidery-preview";
};

const getResponseImageUrl = (imageUrl: string) => {
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const envBase = trimTrailingSlash(import.meta.env.VITE_EMBROIDERY_SERVICE_URL || "");
  const origin = envBase || (import.meta.env.DEV ? "" : "https://ruchitadesigncompany.in");
  return `${origin}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
};

const defaultsForOrigin: Record<string, { fabric: string; density: string; thickness: string; hint: string }> = {
  sashiko: {
    fabric: "coarse indigo-dyed cotton canvas",
    density: "coarse and rustic spacing",
    thickness: "heavy corded yarn",
    hint: "Recommended for Sashiko: coarse indigo cotton canvas.",
  },
  kantha: {
    fabric: "raw rustic linen fabric",
    density: "coarse and rustic spacing",
    thickness: "standard fine embroidery floss",
    hint: "Recommended for Kantha: raw linen or cotton fabric.",
  },
  zardozi: {
    fabric: "deep rich royal velvet fabric",
    density: "complex multi-layered depth",
    thickness: "fine gold purl and metallic wires",
    hint: "Recommended for Zardozi: royal velvet or silk.",
  },
  chikankari: {
    fabric: "sheer semi-transparent fabric",
    density: "fine and delicate",
    thickness: "standard fine embroidery floss",
    hint: "Recommended for Chikankari: sheer cotton organza or muslin.",
  },
  suzhou: {
    fabric: "smooth luxury silk fabric",
    density: "dense and heavily stitched",
    thickness: "standard fine embroidery floss",
    hint: "Recommended for Suzhou silk: smooth high-sheen silk.",
  },
  tatreez: {
    fabric: "even-weave Aida cloth",
    density: "dense and heavily stitched",
    thickness: "standard fine embroidery floss",
    hint: "Recommended for Tatreez: counted even-weave cotton.",
  },
};

const getGuide = (value: string) => ({
  title: guideMap[value]?.title || formatValue(value),
  description:
    guideMap[value]?.description ||
    "Use this selection to bias the generated preview toward a specific embroidery texture, stitch behavior, and finishing mood.",
  fabric: guideMap[value]?.fabric || "Production fabric chosen from the control panel",
  stitches: guideMap[value]?.stitches || "Style-aware embroidery simulation",
  motifs: guideMap[value]?.motifs || "Artwork-driven motif interpretation",
});

const createPresetFile = async (preset: string) => {
  const svg = presetSvgs[preset];
  if (!svg) return null;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    canvas.getContext("2d")?.drawImage(image, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) return null;

    return {
      file: new File([pngBlob], `${preset}-embroidery-preset.png`, { type: "image/png" }),
      previewUrl: canvas.toDataURL("image/png"),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const embroideryFaqs = [
  {
    question: "What is the Embroidery AI Studio?",
    answer: "RDC Embroidery AI Studio is a high-end simulation tool that turns flat vectors or design graphics into realistic thread textures, knots, and stitches, helping textile artists preview mockups.",
  },
  {
    question: "Which embroidery style options are available?",
    answer: "You can select from standard hand embroidery, ribbon embroidery, and ethnic techniques like Indian Phulkari, Bengal Kantha, and Persian Zardozi.",
  },
  {
    question: "Can I define custom thread or motif configurations?",
    answer: "Yes! The custom direction text block lets you provide details like thread color hex codes, stitch density bias, fabric texture, and alignment keywords.",
  },
  {
    question: "Are the embroidery mockups printable?",
    answer: "The simulation produces high-fidelity PNG files that can be used directly in customer presentations, retail product sheets, and textile production briefs.",
  },
];

export default function EmbroideryStudio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("cultural");
  const [selectedCultural, setSelectedCultural] = useState("sashiko");
  const [selectedTechnique, setSelectedTechnique] = useState("hand");
  const [selectedStitch, setSelectedStitch] = useState("none");
  const [selectedSpecialty, setSelectedSpecialty] = useState("none");
  const [fabric, setFabric] = useState("coarse indigo-dyed cotton canvas");
  const [density, setDensity] = useState("coarse and rustic spacing");
  const [thickness, setThickness] = useState("heavy corded yarn");
  const [fabricHint, setFabricHint] = useState("Recommended for Sashiko: coarse indigo cotton canvas.");
  const [customPrompt, setCustomPrompt] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaderText, setLoaderText] = useState("Planning stitch placements...");
  const [notice, setNotice] = useState<Notice>(null);

  const selectedGuide = useMemo(() => {
    if (selectedSpecialty !== "none") return getGuide(selectedSpecialty);
    if (selectedStitch !== "none") return getGuide(selectedStitch);
    return getGuide(selectedCultural);
  }, [selectedCultural, selectedSpecialty, selectedStitch]);

  const selectOption = (option: StyleOption) => {
    if (option.category === "cultural") {
      setSelectedCultural(option.value);
      const defaults = defaultsForOrigin[option.value];
      if (defaults) {
        setFabric(defaults.fabric);
        setDensity(defaults.density);
        setThickness(defaults.thickness);
        setFabricHint(defaults.hint);
      } else {
        setFabric("raw rustic linen fabric");
        setDensity("fine and delicate");
        setThickness("standard fine embroidery floss");
        setFabricHint(`Using ${formatValue(option.value)} compatible fabric defaults.`);
      }
    }

    if (option.category === "technique") {
      setSelectedTechnique(option.value);
    }

    if (option.category === "stitch") {
      setSelectedStitch(option.value);
    }

    if (option.category === "specialty") {
      setSelectedSpecialty(option.value);
      if (option.value === "shadow-work") {
        setFabric("sheer semi-transparent fabric");
        setFabricHint("Shadow work is best on sheer semi-transparent fabric.");
      }
    }
  };

  const isSelected = (option: StyleOption) => {
    if (option.category === "cultural") return selectedCultural === option.value;
    if (option.category === "technique") return selectedTechnique === option.value;
    if (option.category === "stitch") return selectedStitch === option.value;
    return selectedSpecialty === option.value;
  };

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
    setFabric("original");
    setFabricHint("Preserving the uploaded artwork background.");
    setNotice({ type: "success", text: `${file.name} loaded for embroidery preview.` });
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
    setSelectedTechnique("hand");
    setSelectedCultural("sashiko");
    setSelectedStitch("none");
    setSelectedSpecialty("none");
    setFabric("coarse indigo-dyed cotton canvas");
    setDensity("coarse and rustic spacing");
    setThickness("heavy corded yarn");
    setFabricHint("Recommended for Sashiko: coarse indigo cotton canvas.");
    setNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadPreset = async (preset: string) => {
    const generated = await createPresetFile(preset);
    if (!generated) return;
    if (sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    setSourceFile(generated.file);
    setSourceUrl(generated.previewUrl);
    setResultUrl("");
    setSplitPosition(100);
    setActiveTab("cultural");
    const option = culturalOptions.find((item) => item.value === preset);
    if (option) selectOption(option);
    setNotice({ type: "success", text: `${formatValue(preset)} preset loaded.` });
  };

  const generatePreview = async () => {
    if (!sourceFile) {
      setNotice({ type: "error", text: "Upload or choose a preset artwork first." });
      return;
    }

    setIsGenerating(true);
    setProgress(8);
    setNotice(null);

    const steps = [
      "Configuring needle paths...",
      "Building thread depth layers...",
      "Simulating fabric and stitch sheen...",
      "Polishing embroidery preview...",
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
      formData.append("style", selectedCultural);
      formData.append("technique", selectedTechnique);
      formData.append("cultural_origin", selectedCultural);
      formData.append("stitch_style", selectedStitch);
      formData.append("specialty_type", selectedSpecialty);
      formData.append("fabric", fabric);
      formData.append("density", density);
      formData.append("thickness", thickness);
      if (customPrompt.trim()) formData.append("custom_prompt", customPrompt.trim());

      const response = await fetch(resolveEmbroideryApiUrl(), {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.message || `Embroidery preview failed (${response.status})`);
      }

      const imageUrl = payload?.image_url || payload?.url || payload?.result_url;
      if (!imageUrl) {
        throw new Error("No preview image was returned from the server.");
      }

      setResultUrl(`${getResponseImageUrl(imageUrl)}${String(imageUrl).includes("?") ? "&" : "?"}t=${Date.now()}`);
      setSplitPosition(50);
      setProgress(100);
      setNotice({ type: "success", text: "Embroidery preview generated." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Embroidery preview failed.",
      });
    } finally {
      window.clearInterval(interval);
      setIsGenerating(false);
      setLoaderText("Planning stitch placements...");
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `${selectedCultural}_embroidery_preview.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-full bg-[#111315] text-white">
      <div className="border-b border-[#2B3138] bg-[#181B1F]/70 px-5 py-4">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E11D2E]/25 bg-[#E11D2E]/10 text-[#ff4d5d]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-normal text-white">Embroidery AI Studio</h1>
              <p className="text-sm text-[#A1A8B3]">Transform artwork into global embroidery mockups.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#2B3138] bg-[#1C2025] px-3 py-2 text-xs font-semibold text-[#A1A8B3]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
            Gemini embroidery preview
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-4 p-4 xl:grid-cols-[330px_minmax(0,1fr)_340px]">
        <aside className="overflow-hidden rounded-lg border border-[#2B3138] bg-[#181B1F] xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)]">
          <div className="border-b border-[#2B3138] p-4">
            <p className="text-xs font-bold uppercase text-[#E11D2E]">1. Choose Style</p>
            <h2 className="mt-1 text-base font-semibold text-white">Style and Pattern</h2>
          </div>
          <div className="grid grid-cols-4 gap-1 border-b border-[#2B3138] bg-[#111315] p-2">
            {styleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#E11D2E] text-white"
                    : "text-[#A1A8B3] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[520px] space-y-2 overflow-y-auto p-3 custom-scrollbar">
            {tabOptions[activeTab].map((option) => (
              <button
                key={`${option.category}-${option.value}`}
                onClick={() => selectOption(option)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                  isSelected(option)
                    ? "border-[#E11D2E]/70 bg-[#E11D2E]/10"
                    : "border-[#2B3138] bg-[#1C2025] hover:border-[#E11D2E]/35 hover:bg-[#20242A]"
                }`}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                  style={{ backgroundColor: option.accent }}
                >
                  {option.code}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#A1A8B3]">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <section
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
            className="relative min-h-[520px] overflow-hidden rounded-lg border border-dashed border-[#2B3138] bg-[#181B1F]"
          >
            {!sourceUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[520px] w-full flex-col items-center justify-center gap-4 p-8 text-center transition hover:bg-white/[0.02]"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-[#2B3138] bg-[#1C2025] text-[#A1A8B3]">
                  <UploadCloud className="h-9 w-9" />
                </span>
                <span>
                  <span className="block text-lg font-semibold text-white">Upload artwork or drag it here</span>
                  <span className="mt-2 block text-sm text-[#A1A8B3]">PNG, JPG, JPEG, or WEBP. Presets are below for quick testing.</span>
                </span>
              </button>
            ) : (
              <div className="relative h-[520px] select-none bg-[#0F1113]">
                {resultUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src={resultUrl} alt="Embroidered preview" className="max-h-[92%] max-w-[92%] rounded-lg object-contain shadow-2xl" />
                  </div>
                )}
                <div
                  className="absolute inset-y-0 left-0 z-10 overflow-hidden border-r border-white/30"
                  style={{ width: `${resultUrl ? splitPosition : 100}%` }}
                >
                  <div className="flex h-full w-[var(--viewer-width)] items-center justify-center" style={{ "--viewer-width": "100%" } as CSSProperties}>
                    <img src={sourceUrl} alt="Original artwork" className="max-h-[92%] max-w-[92%] rounded-lg object-contain shadow-2xl" />
                  </div>
                </div>

                {resultUrl && (
                  <button
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setIsDragging(true);
                    }}
                    className="absolute top-0 z-20 flex h-full w-10 -translate-x-1/2 cursor-ew-resize items-center justify-center"
                    style={{ left: `${splitPosition}%` }}
                    aria-label="Move comparison slider"
                  >
                    <span className="h-full w-0.5 bg-white shadow-[0_0_16px_rgba(255,255,255,0.7)]" />
                    <span className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-[#E11D2E] bg-white text-[#E11D2E]">
                      <Scissors className="h-4 w-4" />
                    </span>
                  </button>
                )}

                <span className="absolute bottom-4 left-4 z-30 rounded-md border border-[#2B3138] bg-black/70 px-3 py-1 text-xs font-bold uppercase text-white">
                  Original
                </span>
                {resultUrl && (
                  <span className="absolute bottom-4 right-4 z-30 rounded-md bg-[#E11D2E] px-3 py-1 text-xs font-bold uppercase text-white">
                    Embroidered
                  </span>
                )}
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#111315]/90 p-8 backdrop-blur-md">
                <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                  <Loader2 className="absolute h-16 w-16 animate-spin text-[#E11D2E]" />
                  <Wand2 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Generating embroidery</h3>
                <p className="mt-2 text-sm text-[#A1A8B3]">{loaderText}</p>
                <div className="mt-5 h-2 w-64 overflow-hidden rounded-full bg-[#2B3138]">
                  <div className="h-full rounded-full bg-[#E11D2E] transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#2B3138] bg-[#181B1F] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-[#E11D2E]">Preset artwork</p>
                <h2 className="mt-1 text-base font-semibold text-white">Start from sample stitch layouts</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {["sashiko", "otomi", "zardozi"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => void loadPreset(preset)}
                    className="flex items-center gap-2 rounded-full border border-[#2B3138] bg-[#1C2025] px-3 py-2 text-xs font-semibold text-[#A1A8B3] transition hover:border-[#E11D2E]/40 hover:text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#E11D2E]" />
                    {formatValue(preset)}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-1 custom-scrollbar">
          <section className="rounded-lg border border-[#2B3138] bg-[#181B1F]">
            <div className="border-b border-[#2B3138] p-4">
              <p className="text-xs font-bold uppercase text-[#E11D2E]">2. Customize</p>
              <h2 className="mt-1 text-base font-semibold text-white">Embroidery Settings</h2>
            </div>
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase text-[#A1A8B3]">Fabric Background</span>
                <select
                  value={fabric}
                  onChange={(event) => {
                    setFabric(event.target.value);
                    setFabricHint(event.target.value === "original" ? "Preserving the uploaded artwork background." : `Using ${event.target.value}.`);
                  }}
                  className="h-10 w-full rounded-md border border-[#2B3138] bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/60"
                >
                  {fabricOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatValue(option)}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs text-[#A1A8B3]">{fabricHint}</span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase text-[#A1A8B3]">Stitch Density</span>
                <select
                  value={density}
                  onChange={(event) => setDensity(event.target.value)}
                  className="h-10 w-full rounded-md border border-[#2B3138] bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/60"
                >
                  {densityOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatValue(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase text-[#A1A8B3]">Thread Thickness</span>
                <select
                  value={thickness}
                  onChange={(event) => setThickness(event.target.value)}
                  className="h-10 w-full rounded-md border border-[#2B3138] bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/60"
                >
                  {thicknessOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatValue(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase text-[#A1A8B3]">Custom Direction</span>
                <textarea
                  value={customPrompt}
                  onChange={(event) => setCustomPrompt(event.target.value)}
                  rows={4}
                  placeholder="Add brand, garment, motif, thread color, or finishing notes..."
                  className="w-full resize-none rounded-md border border-[#2B3138] bg-[#111315] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#E11D2E]/60"
                />
              </label>

              <div className="rounded-lg border border-dashed border-[#2B3138] bg-[#111315] p-3">
                <p className="mb-2 text-xs font-bold uppercase text-[#A1A8B3]">Active configuration</p>
                <div className="flex flex-wrap gap-2">
                  {[selectedTechnique, selectedCultural, selectedStitch, selectedSpecialty]
                    .filter((item) => item !== "none")
                    .map((item) => (
                      <span key={item} className="rounded-full border border-[#E11D2E]/20 bg-[#E11D2E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#ff8a96]">
                        {formatValue(item)}
                      </span>
                    ))}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) loadFile(file);
                }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#2B3138] bg-[#1C2025] text-sm font-semibold text-white transition hover:border-[#E11D2E]/40 hover:bg-[#20242A]"
              >
                <ImageUp className="h-4 w-4 text-[#E11D2E]" />
                Upload Image
              </button>

              <button
                onClick={() => void generatePreview()}
                disabled={!sourceFile || isGenerating}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#E11D2E] text-sm font-bold text-white transition hover:bg-[#c91526] disabled:cursor-not-allowed disabled:bg-[#2B3138] disabled:text-[#6B7280]"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate Embroidery Preview
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={resetWorkspace}
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2B3138] bg-[#111315] text-sm font-semibold text-[#A1A8B3] transition hover:text-white"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  onClick={downloadResult}
                  disabled={!resultUrl}
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2B3138] bg-[#111315] text-sm font-semibold text-[#A1A8B3] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#4B5563]"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>

              {notice && (
                <div
                  className={`rounded-md border px-3 py-2 text-sm ${
                    notice.type === "error"
                      ? "border-[#E11D2E]/30 bg-[#E11D2E]/10 text-[#ffb3b3]"
                      : notice.type === "success"
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                        : "border-[#2B3138] bg-[#111315] text-[#A1A8B3]"
                  }`}
                >
                  {notice.text}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[#2B3138] bg-[#181B1F] p-4">
            <p className="text-xs font-bold uppercase text-[#E11D2E]">Style Guide</p>
            <h3 className="mt-2 text-base font-semibold text-white">{selectedGuide.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#A1A8B3]">{selectedGuide.description}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-[#6B7280]">Fabric</p>
                <p className="mt-1 text-[#D1D5DB]">{selectedGuide.fabric}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-[#6B7280]">Stitches</p>
                <p className="mt-1 text-[#D1D5DB]">{selectedGuide.stitches}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-[#6B7280]">Motifs</p>
                <p className="mt-1 text-[#D1D5DB]">{selectedGuide.motifs}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Promotional Info / Description Sections */}
      <div className="mt-16 space-y-20 border-t border-[#2B3138]/40 pt-16 pb-8">
        {/* Section 1: AI Embroidery Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              AI Embroidery Simulation
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Transform your graphic designs, vector art, and logos into realistic embroidery textures. Our custom neural engine analyzes boundaries, contrasts, and color blocks to place lifelike thread paths, satin stitches, knots, and embroidery relief layers that feel completely physical.
            </p>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Whether preparing digital assets for apparel mocks, client showcases, or manufacturing instructions, you can bypass expensive stitching samples and evaluate realistic textures in a click.
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

        {/* Section 2: High Fidelity Stitches */}
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
              High Fidelity Stitches
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Explore complex embroidery modes. From flat hand running stitches to ribbon folds, chain links, and opulent gold relief (Zardozi), the simulation scales the stitch count and thread thickness dynamically based on your fabric settings and style selections.
            </p>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Every detail is rendered down to individual thread shine and fiber twists, providing premium simulation quality aligned with physical production.
            </p>
          </div>
        </div>

        {/* Section 3: How the Embroidery Generator Works */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              How the Embroidery Generator Works
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Simply upload your flat design graphic, select your target style origin (Cultural, Technique, Stitches, or Specialty), set custom styling directions in the editor prompt block, and generate. The preview displays side-by-side comparison files so you can check thread layout before downloading the mock.
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
          AI Embroidery Studio: FAQs
        </h2>
        <div className="space-y-0">
          {embroideryFaqs.map((faq, index) => {
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
  );
}
