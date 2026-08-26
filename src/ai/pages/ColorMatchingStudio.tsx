import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  CloudUpload,
  Download,
  Image as ImageIcon,
  Maximize2,
  Palette,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";

import { separateColors } from "@/api/colorSeparationApi";
import { buildBackgroundForm, generateImage, normalizeBackendImageUrl, resolveImageUrl } from "@/api/imageToImageApi";
import { PRESET_CATEGORIES, type GenerateResponse, type PresetId } from "@/types/textile";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";
import AiCreditCost from "@/ai/components/AiCreditCost";

const PRESET_MATCHING_CREDIT_COST = 5;
const BACKGROUND_RECOLOR_CREDIT_COST = 10;
const PRECISE_COLOR_CHANGE_CREDIT_COST = 15;

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
  "image/tiff",
];
const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const BACKGROUND_WHITE_SWATCHES = ["#FFFFFF", "#F7F3EA", "#F2F2EF", "#FFF8E7"] as const;
const MAX_DETECTED_IMAGE_COLORS = 8;
const DEFAULT_EDIT_STRENGTH = 0.7;
const DEFAULT_REFERENCE_STRENGTH = 0.7;
const DEFAULT_PROMPT_STRENGTH = 0.7;

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

const DARK_MUTED_MOOD_PALETTES = [
  { family: "dark_warm", id: "molten_copper", label: "Molten Copper - Pitch, soot, smolder, copper glow, peach buff, red oxide", colors: ["#0E0600", "#1F0E00", "#341B00", "#FF8A3D", "#F7C58B", "#FF4A12"] },
  { family: "dark_warm", id: "scorched_earth", label: "Scorched Earth - Char, cinder, terra, burnt sienna, sand ochre, bone white", colors: ["#120600", "#221000", "#3A1C00", "#E6953B", "#F0C486", "#F5DEB0"] },
  { family: "dark_warm", id: "black_amber", label: "Black Amber - Onyx, dark amber, deep gold, amber blaze, honey gold, candlelight", colors: ["#0D0900", "#1C1400", "#2F2200", "#F2A900", "#FFD95A", "#F9EFC5"] },
  { family: "dark_warm", id: "smoldering_rose", label: "Smoldering Rose - Dark wine, maroon, ruby dark, coral ember, tangerine, champagne rose", colors: ["#140008", "#260010", "#3F0018", "#FF6B6B", "#FFAA3D", "#F7DED6"] },
  { family: "dark_warm", id: "desert_night", label: "Desert Night - Dune black, sand shadow, dusk clay, terracotta, desert wheat, dusk saffron", colors: ["#100A04", "#1E1408", "#332210", "#D89567", "#E8CF98", "#FF9300"] },
  { family: "dark_warm", id: "forge_fire", label: "Forge Fire - Forge black, iron, slag, deep orange, spark yellow, forge cream", colors: ["#0A0300", "#180700", "#2C0F00", "#FF4B1F", "#FFC400", "#F6E1CF"] },
  { family: "dark_warm", id: "dark_saffron", label: "Dark Saffron - Midnight spice, turmeric dark, cardamom, saffron, golden mango, chili red", colors: ["#0F0900", "#1F1400", "#362200", "#FF9F1C", "#FFC86B", "#FF4A12"] },
  { family: "dark_warm", id: "mahogany_smoke", label: "Mahogany Smoke - Espresso, dark mahogany, rosewood, cognac, warm cream, peach wood", colors: ["#0E0806", "#1E120F", "#301A14", "#C06F45", "#F0C49A", "#E69A6A"] },
  { family: "dark_warm", id: "lava_bed", label: "Lava Bed - Crust, basalt, magma dark, lava red, magma orange, sulfur yellow", colors: ["#110200", "#220500", "#3C0A00", "#FF3D12", "#FF9B3D", "#F5D66F"] },
  { family: "dark_warm", id: "cinnamon_dusk", label: "Cinnamon Dusk - Dark bark, cinnamon dark, spice brown, cinnamon, almond, apricot", colors: ["#110804", "#221308", "#3A2010", "#D96B1C", "#EAC19A", "#FFB24A"] },
  { family: "dark_warm", id: "dying_sun", label: "Dying Sun - Night horizon, dusk ash, ember brown, sunset coral, golden hour, warm ivory", colors: ["#0E0500", "#200E00", "#381800", "#FF6A3D", "#FFC34A", "#F8DFC0"] },
  { family: "dark_warm", id: "black_pepper", label: "Black Pepper - Pepper black, dark spice, cumin, wheat gold, linen, paprika", colors: ["#0C0904", "#1A1508", "#2C210F", "#D3AE68", "#F0E0B8", "#D96F3D"] },
  { family: "dark_cool", id: "deep_ocean", label: "Deep Ocean - Abyss, trench, deep sea, ocean blue, ice foam, biolum", colors: ["#010D18", "#041E33", "#0A3050", "#5BC8F5", "#B8EEFF", "#00FFD1"] },
  { family: "dark_cool", id: "glacier_cave", label: "Glacier Cave - Glacier black, permafrost, ice cave, glacier, snowmelt, pure ice", colors: ["#040E14", "#0A1E28", "#123040", "#7FD4E8", "#D6F4FF", "#FFFFFF"] },
  { family: "dark_cool", id: "midnight_teal", label: "Midnight Teal - Void teal, dark kelp, sea floor, teal neon, mint mist, aqua sky", colors: ["#010F0C", "#031F18", "#073327", "#2EE8C4", "#A8FFF0", "#63D4FF"] },
  { family: "dark_cool", id: "arctic_indigo", label: "Arctic Indigo - Deep ink, night indigo, cold slate, periwinkle, frost blue, cyan arc", colors: ["#06060F", "#0D0D22", "#181838", "#8FA8FF", "#C8D8FF", "#00E5FF"] },
  { family: "dark_cool", id: "abyssal_purple", label: "Abyssal Purple - Void dark, abyss, dark plum, violet, lilac mist, cool cyan", colors: ["#080010", "#130020", "#220038", "#C084FC", "#EED9FF", "#60CFFF"] },
  { family: "dark_cool", id: "steel_storm", label: "Steel Storm - Steel black, gun metal, storm grey, steel blue, mist white, teal flash", colors: ["#080C10", "#101820", "#1A2A38", "#90B4CE", "#D8EAF5", "#4DD0E1"] },
  { family: "dark_cool", id: "frozen_violet", label: "Frozen Violet - Night ink, dark violet, dusk violet, soft violet, lavender, ice azure", colors: ["#07040F", "#110C22", "#1E1640", "#BFA8FF", "#E8DDFF", "#78D4FF"] },
  { family: "dark_cool", id: "moonlit_slate", label: "Moonlit Slate - Moon black, dark slate, night slate, moon glow, starlight, seafoam", colors: ["#080C12", "#121C28", "#1E2E40", "#A0B8D8", "#E0EDF8", "#52C8B4"] },
  { family: "dark_cool", id: "sapphire_night", label: "Sapphire Night - Sapphire dark, navy deep, royal night, sapphire, sky pearl, teal glow", colors: ["#020814", "#061428", "#0C2040", "#5DA8FF", "#C0DEFF", "#00F5D4"] },
  { family: "dark_cool", id: "cobalt_frost", label: "Cobalt Frost - Cobalt black, dark cobalt, frost night, cobalt, ice blue, mint frost", colors: ["#040A16", "#091428", "#102040", "#60A8E8", "#B8DAFF", "#A8F6E8"] },
  { family: "dark_cool", id: "northern_lights", label: "Northern Lights - Aurora black, tundra, polar night, aurora, northern light green, aurora violet", colors: ["#030D0E", "#071C20", "#0E2E34", "#00E5C8", "#80FFD4", "#C8AAFF"] },
  { family: "dark_cool", id: "phantom_blue", label: "Phantom Blue - Phantom, void blue, dusk navy, ghost blue, haze white, spearmint", colors: ["#05080F", "#0A1020", "#141E38", "#6EC6FF", "#D0EEFF", "#A0F0E0"] },
  { family: "dark_gray", id: "ash_dusk", label: "Ash Dusk - Char black, ash dark, soot, dim gray, silver ash, pale smoke", colors: ["#0E0E0E", "#1A1A1A", "#2C2C2C", "#787878", "#A8A8A8", "#DCDCDC"] },
  { family: "dark_gray", id: "pewter_fog", label: "Pewter Fog - Fog black, pewter dark, iron fog, pewter, cool gray, fog white", colors: ["#0C0E10", "#161C20", "#242E34", "#6A7C88", "#9AACB8", "#D8E4EC"] },
  { family: "dark_gray", id: "charcoal_mist", label: "Charcoal Mist - Mist black, graphite, dark mist, slate gray, mist gray, haze white", colors: ["#0A0A0C", "#16161C", "#26262E", "#606070", "#9090A0", "#D0D0DC"] },
  { family: "dark_gray", id: "smoke_quartz", label: "Smoke Quartz - Quartz black, smoke plum, dark quartz, mauve gray, dusty mauve, pale lilac", colors: ["#0E0C10", "#1C1820", "#2C2834", "#685878", "#9888A8", "#D4C8E0"] },
  { family: "dark_gray", id: "cinder_slate", label: "Cinder Slate - Cinder black, cold cinder, slate ash, slate gray, ashen blue, silver mist", colors: ["#0A0C0E", "#141C22", "#202C36", "#587080", "#8898A8", "#C8D4DC"] },
  { family: "dark_gray", id: "iron_veil", label: "Iron Veil - Iron black, dark iron, steel veil, iron gray, veil gray, bone gray", colors: ["#0C0C0C", "#181C1C", "#262E2E", "#5C6868", "#8C9090", "#C8D0D0"] },
  { family: "dark_khaki", id: "dusty_khaki", label: "Dusty Khaki - Dark earth, deep khaki, mud, khaki, sand, linen dust", colors: ["#100E08", "#1E1A10", "#302C1C", "#8C7E58", "#C4B48A", "#EDE0C4"] },
  { family: "dark_khaki", id: "desert_ruin", label: "Desert Ruin - Ruin dark, old stone, worn oak, khaki stone, dust tan, pale dune", colors: ["#120F06", "#221C0C", "#382E16", "#7A6840", "#B8A070", "#E8D8AC"] },
  { family: "dark_khaki", id: "olive_drab", label: "Olive Drab - Drab black, olive night, army dark, olive khaki, field tan, canvas", colors: ["#0C0E08", "#181C10", "#28301C", "#707048", "#A8A870", "#D8D8B0"] },
  { family: "dark_khaki", id: "tawny_field", label: "Tawny Field - Field black, tawny dark, bark, tawny, warm khaki, parchment", colors: ["#110D06", "#201808", "#342810", "#887040", "#C0A060", "#E8D4A0"] },
  { family: "dark_khaki", id: "steppe_dust", label: "Steppe Dust - Steppe black, dark loam, dust brown, dry khaki, steppe tan, wheat dust", colors: ["#0E0C08", "#1C180E", "#2E2818", "#7C7050", "#B4A478", "#E0D4B0"] },
  { family: "dark_khaki", id: "fossil_ground", label: "Fossil Ground - Fossil black, dark fossil, stone brown, clay khaki, fossil tan, ivory stone", colors: ["#0F0D0A", "#1E1C14", "#302C1E", "#806A48", "#BCA882", "#E4D8BC"] },
  { family: "dusty", id: "dusty_rose_dusk", label: "Dusty Rose Dusk - Dark rose, dusty wine, faded plum, dusty rose, blush dust, faded pink", colors: ["#1A0E0E", "#2A1818", "#3C2424", "#A87070", "#C49090", "#DDB8B8"] },
  { family: "dusty", id: "faded_sage", label: "Faded Sage - Dark sage, sage night, dusty fern, sage mist, faded sage, pale herb", colors: ["#0C120E", "#181E18", "#262E26", "#6A9478", "#8AAE98", "#BBCCBE"] },
  { family: "dusty", id: "smoky_mauve", label: "Smoky Mauve - Mauve black, smoky plum, dark mauve, dusty violet, smoky mauve, pale wisteria", colors: ["#14101A", "#221C2C", "#342840", "#887098", "#A890B0", "#CBCBD4"] },
  { family: "dusty", id: "dusty_teal_hollow", label: "Dusty Teal Hollow - Teal void, dark teal, hollow teal, dusty aqua, faded teal, pale teal", colors: ["#081412", "#10221E", "#1C3430", "#5A8C88", "#7AACAA", "#AACCCA"] },
  { family: "dusty", id: "faded_coral_ash", label: "Faded Coral Ash - Coral ash, dusty brown, burnt ash, dusty coral, faded coral, dusty peach", colors: ["#180E0A", "#281810", "#3A2418", "#A87060", "#C4907A", "#DDB8A8"] },
  { family: "dusty", id: "dusty_indigo_haze", label: "Dusty Indigo Haze - Indigo black, dusty indigo, haze navy, faded indigo, dusty blue, lavender haze", colors: ["#0E0E1C", "#1A1A2E", "#282840", "#6868A8", "#8888C0", "#BBB8D8"] },
  { family: "dusty", id: "muted_ochre_shadow", label: "Muted Ochre Shadow - Ochre black, dark ochre, dusty gold, muted ochre, faded gold, dusty wheat", colors: ["#140E04", "#221A08", "#342810", "#907840", "#B89C60", "#D8C898"] },
  { family: "dusty", id: "dusty_cerulean", label: "Dusty Cerulean - Cerulean dark, dusty navy, faded blue, dusty cerulean, muted sky, pale haze", colors: ["#080E16", "#101C28", "#1C2E3C", "#587898", "#7898B8", "#AABCCC"] },
  { family: "dusty", id: "worn_burgundy", label: "Worn Burgundy - Worn dark, faded wine, dusty burgundy, dusty crimson, faded rose, dusty blush", colors: ["#160A10", "#241018", "#381824", "#905060", "#B07080", "#CCA0A8"] },
  { family: "dusty", id: "dusty_moss_vale", label: "Dusty Moss Vale - Moss black, dark moss, dusty vale, muted moss, dusty green, pale moss", colors: ["#0A0E0A", "#141C12", "#202E1C", "#688860", "#8AA880", "#B4C8AC"] },
  { family: "dusty", id: "faded_lavender_night", label: "Faded Lavender Night - Lavender night, dusty lavender, faded dusk, muted lavender, dusty lilac, pale lavender", colors: ["#100E18", "#1C1828", "#2C2638", "#8878A8", "#A898C8", "#C8BCDC"] },
  { family: "dusty", id: "dusty_copper_haze", label: "Dusty Copper Haze - Copper black, dusty bronze, old copper, muted copper, dusty copper, faded blush", colors: ["#140C08", "#221610", "#34221A", "#906848", "#B88868", "#D4B098"] },
  { family: "dark_dusty", id: "dark_dusty_plum", label: "Dusty Plum - Plum void, dusty plum, faded aubergine, muted sage, dusty sage, pale herb", colors: ["#140E18", "#221B28", "#32263A", "#5A7860", "#7A9880", "#AABCAA"] },
  { family: "dark_dusty", id: "dark_dusty_teal", label: "Dusty Teal - Teal abyss, dark teal, faded teal, dusty rose, blush dust, faded pink", colors: ["#080E0E", "#101E1E", "#1C2E2E", "#A07070", "#C09090", "#DBB4B4"] },
  { family: "dark_dusty", id: "dark_dusty_navy", label: "Dusty Navy - Navy void, dusty navy, haze blue, muted ochre, dusty gold, faded wheat", colors: ["#080C14", "#101B24", "#1A2638", "#907840", "#B89C60", "#DBC898"] },
  { family: "dark_dusty", id: "dark_dusty_moss", label: "Dusty Moss - Moss void, dark moss, faded fern, dusty violet, smoky mauve, pale wisteria", colors: ["#0A0E0A", "#141C12", "#202C1C", "#887098", "#A890B0", "#C8BBD0"] },
  { family: "dark_dusty", id: "dark_dusty_charcoal", label: "Dusty Charcoal - Char black, char dark, faded charcoal, dusty coral, faded coral, pale terracotta", colors: ["#0E0C0C", "#1C1818", "#2C2424", "#A06858", "#C0887A", "#DBB0A4"] },
  { family: "dark_dusty", id: "dark_dusty_indigo", label: "Dusty Indigo - Indigo void, dusty indigo, haze indigo, muted copper, dusty copper, faded bronze", colors: ["#0C0C18", "#181828", "#26263C", "#906848", "#B89070", "#D4B498"] },
  { family: "dark_dusty", id: "dark_dusty_slate", label: "Dusty Slate - Slate void, dusty slate, faded slate, dusty lavender, faded lilac, pale lavender", colors: ["#0C1014", "#181E24", "#242E38", "#8070A8", "#A898C8", "#C8BCDC"] },
  { family: "dark_dusty", id: "dark_dusty_burgundy", label: "Dusty Burgundy - Burgundy void, dusty burgundy, faded crimson, dusty aqua, faded teal, pale aqua", colors: ["#140810", "#22101C", "#341828", "#508A88", "#7AACAA", "#A8C8C6"] },
  { family: "dark_dusty", id: "dark_dusty_olive", label: "Dusty Olive - Olive void, dusty olive, faded army, dusty cerulean, muted sky, pale haze", colors: ["#0C0E08", "#181C10", "#262C1A", "#587898", "#7898B8", "#AABCCC"] },
  { family: "dark_dusty", id: "dark_dusty_graphite", label: "Dusty Graphite - Graphite black, graphite, dark pewter, dusty blush, faded rose, pale blush", colors: ["#0E0E0E", "#1A1A1A", "#2A2A2A", "#A87878", "#C8A0A0", "#E0C4C4"] },
  { family: "dark_dusty", id: "dark_dusty_brown", label: "Dusty Brown - Brown void, dusty brown, faded bark, muted sage, dusty herb, pale fern", colors: ["#100C08", "#1E1610", "#2E2218", "#6A8870", "#90A888", "#BBC8B4"] },
  { family: "dark_dusty", id: "dark_dusty_violet", label: "Dusty Violet - Violet void, dusty violet, faded violet, muted ochre, dusty ochre, faded gold", colors: ["#100C18", "#1C1628", "#2C2238", "#907838", "#B89A58", "#D8C490"] },
] as const;

const DARK_MOOD_PRESET_IDS = ["dark", "dark_warm", "dark_cool", "dark_gray", "dark_khaki", "dusty", "dark_dusty"] as const;

const PLAYFUL_MOOD_PALETTES = [
  { family: "fresh", id: "morning_dew", label: "Morning Dew - Dew mint, soft mint, spring green, fresh mint, meadow, pure white", colors: ["#E8FBF0", "#C8EEE0", "#A0DCC4", "#2ECC80", "#0FA860", "#FFFFFF"] },
  { family: "fresh", id: "lemon_zest", label: "Lemon Zest - Cream glow, soft lemon, lemon, zest, amber, crisp white", colors: ["#FFFDE8", "#FFF5A0", "#FFE840", "#F5C800", "#C89800", "#FFFFFF"] },
  { family: "fresh", id: "sky_wash", label: "Sky Wash - Sky white, soft sky, cornflower, clear sky, ocean, cloud", colors: ["#EAF6FF", "#CDE4FF", "#80C8FF", "#28A8F5", "#0070C0", "#FFFFFF"] },
  { family: "fresh", id: "watermelon_slice", label: "Watermelon Slice - Blush ice, soft pink, watermelon, juicy red, rind dark, rind green", colors: ["#FFF0F0", "#FFD0D8", "#FF9090", "#F03060", "#A01040", "#70D860"] },
  { family: "fresh", id: "citrus_grove", label: "Citrus Grove - Cream peel, soft peach, tangerine, orange pop, blood orange, lime leaf", colors: ["#FFF5E8", "#FFDBA0", "#FFB850", "#FF7A20", "#CC4800", "#48CC30"] },
  { family: "fresh", id: "lavender_field", label: "Lavender Field - Petal white, soft lavender, lavender, violet, deep violet, bloom white", colors: ["#F4EEFF", "#DDD0FF", "#B898FF", "#8050E8", "#5020B0", "#FFFFFF"] },
  { family: "fresh", id: "peach_blossom", label: "Peach Blossom - Peach ice, blossom, peach, apricot, persimmon, petal white", colors: ["#FFF3EE", "#FFD8C8", "#FFAA88", "#FF7048", "#C83820", "#FFFFFF"] },
  { family: "fresh", id: "aqua_breeze", label: "Aqua Breeze - Breeze ice, pale aqua, turquoise, aqua, deep teal, sea foam", colors: ["#E8FAFA", "#B0EEEE", "#60D8D8", "#10B8B8", "#087878", "#FFFFFF"] },
  { family: "fresh", id: "rose_garden", label: "Rose Garden - Rose ice, petal pink, rose, hot pink, deep rose, bloom white", colors: ["#FFF0F5", "#FFD0E4", "#FF90B8", "#E83878", "#A81850", "#FFFFFF"] },
  { family: "fresh", id: "lime_sorbet", label: "Lime Sorbet - Sorbet ice, pale lime, lime, lime pop, forest lime, zest yellow", colors: ["#F4FFE8", "#D8FFAA", "#AAEE50", "#70CC00", "#409800", "#FFD040"] },
  { family: "fresh", id: "cotton_candy_fresh", label: "Cotton Candy - Candy white, soft lilac, cotton pink, candy violet, bubblegum, sky pop", colors: ["#F8F0FF", "#EDD8FF", "#FFB8E0", "#C060FF", "#FF60B0", "#80E8FF"] },
  { family: "fresh", id: "ocean_spray", label: "Ocean Spray - Spray white, pale spray, sea glass, ocean blue, deep sea, foam white", colors: ["#E0FAFF", "#B8ECFF", "#60CCEE", "#00A8D8", "#006888", "#FFFFFF"] },
  { family: "candy", id: "bubblegum_pop", label: "Bubblegum Pop - Bubblegum, pale gum, blush, sugar white, candy blue, lemon drop", colors: ["#FF80C0", "#FFB0D8", "#FFE0F0", "#FFFFFF", "#AFE0FF", "#FFE840"] },
  { family: "candy", id: "strawberry_fizz", label: "Strawberry Fizz - Strawberry, pale berry, sherbet, fizz white, lime pop, lemon", colors: ["#FF3050", "#FF8098", "#FFD0D8", "#FFFFFF", "#80F080", "#FFF060"] },
  { family: "candy", id: "lemon_sherbet", label: "Lemon Sherbet - Lemon, pale lemon, sherbet, sugar white, candy red, soda blue", colors: ["#FFE820", "#FFF280", "#FFFAC0", "#FFFFFF", "#FF6088", "#A0D8FF"] },
  { family: "candy", id: "mint_choc_chip", label: "Mint Choc Chip - Mint, pale mint, ice mint, cream, choc chip, candy pink", colors: ["#40E0B0", "#90F0D8", "#C8FFF0", "#FFFFFF", "#4A2A10", "#FF80C0"] },
  { family: "candy", id: "grape_soda", label: "Grape Soda - Grape, pale grape, lavender, soda ice, pop yellow, lime", colors: ["#9040F0", "#C080FF", "#E0C0FF", "#F8F0FF", "#FFE040", "#60F0A0"] },
  { family: "candy", id: "orange_creamsicle", label: "Orange Creamsicle - Orange, creamsicle, pale pop, cream, vanilla, grape pop", colors: ["#FF8020", "#FFB070", "#FFD0A0", "#FFF8F0", "#FFFFFF", "#A040F0"] },
  { family: "candy", id: "blue_raspberry", label: "Blue Raspberry - Blue razz, ice razz, pale razz, soda ice, cherry, sour lemon", colors: ["#1080FF", "#80B8FF", "#B0D8FF", "#F0F8FF", "#FF3050", "#FFE330"] },
  { family: "candy", id: "watermelon_gummy", label: "Watermelon Gummy - Watermelon, pale watermelon, sherbet, sugar, rind green, seed black", colors: ["#FF2848", "#FF7890", "#FFD0D8", "#FFFFFF", "#28C840", "#000000"] },
  { family: "candy", id: "peach_rings", label: "Peach Rings - Peach, pale peach, cream peach, sugar ice, sour apple, hot pink", colors: ["#FF9858", "#FFBF90", "#FFE0C0", "#FFF8F0", "#60D8A0", "#FF4080"] },
  { family: "candy", id: "candy_floss", label: "Candy Floss - Candy floss, pale floss, cloud, pure white, baby blue, violet", colors: ["#FF70C8", "#FFB0E0", "#FFE0F4", "#FFFFFF", "#70C8FF", "#C0A0FF"] },
  { family: "candy", id: "sour_worm", label: "Sour Worm - Sour lime, pale lime, sour ice, fizz white, cherry, grape", colors: ["#A0F020", "#D0FF70", "#EEFFA0", "#FFFFFF", "#FF4080", "#7840F0"] },
  { family: "candy", id: "rainbow_drops", label: "Rainbow Drops - Red drop, orange, yellow, green, blue, violet", colors: ["#FF4040", "#FF9820", "#FFE020", "#40D860", "#2090FF", "#C040FF"] },
  { family: "ice_cream", id: "vanilla_bean", label: "Vanilla Bean - Cream ice, vanilla, custard, caramel, vanilla bean, caramel drizzle", colors: ["#FDFBEC", "#F5E8C0", "#E8D090", "#C8A860", "#4A2A08", "#C84818"] },
  { family: "ice_cream", id: "strawberry_scoop", label: "Strawberry Scoop - Milk ice, strawberry, deep berry, jam, dark berry, waffle cone", colors: ["#FFF0F2", "#FFD0D8", "#FFAAB8", "#E85870", "#801828", "#F5E8C0"] },
  { family: "ice_cream", id: "pistachio_dream", label: "Pistachio Dream - Mint cream, pistachio, pale nut, pistachio, dark nut, honey drizzle", colors: ["#F0F8EC", "#D0ECC0", "#A8D990", "#68A850", "#284018", "#E8C880"] },
  { family: "ice_cream", id: "chocolate_fudge", label: "Chocolate Fudge - Dark chocolate, fudge, milk chocolate, caramel, cream, cherry top", colors: ["#1C0C04", "#3C1C08", "#7A3C18", "#C07850", "#F5E8C0", "#FF80C0"] },
  { family: "ice_cream", id: "blueberry_ripple", label: "Blueberry Ripple - Milk ice, lavender, blueberry, deep blue, ripple dark, waffle", colors: ["#F0F0FF", "#C0BCF8", "#9080E0", "#5040A8", "#1F1838", "#F5E8C0"] },
  { family: "ice_cream", id: "mango_sorbet", label: "Mango Sorbet - Sorbet ice, pale mango, mango, mango deep, dark sorbet, lime leaf", colors: ["#FFFBE8", "#FFE898", "#FFD040", "#F09020", "#A04008", "#60C878"] },
  { family: "ice_cream", id: "cookies_cream", label: "Cookies & Cream - Cream, pale cream, cookie grey, cookie, dark cookie, cherry", colors: ["#F8F8F8", "#E0E0E0", "#909090", "#303030", "#080808", "#E85870"] },
  { family: "ice_cream", id: "raspberry_ripple", label: "Raspberry Ripple - Milk ice, pale raspberry, raspberry, deep raspberry, ripple, waffle", colors: ["#FFF4F8", "#FFD0E4", "#FF90B8", "#E03070", "#800030", "#F5E8C0"] },
  { family: "ice_cream", id: "mint_chip", label: "Mint Chip - Pale mint, soft mint, mint, deep mint, choc chip, cone", colors: ["#EEFFF8", "#C0F0D8", "#70D8A8", "#28A870", "#4A2010", "#E8C880"] },
  { family: "ice_cream", id: "peach_melba", label: "Peach Melba - Cream, peach cream, peach, peach deep, raspberry, waffle", colors: ["#FFF8F0", "#FFE0C0", "#FFB878", "#FF8040", "#E85070", "#F5E8C0"] },
  { family: "ice_cream", id: "neapolitan", label: "Neapolitan - Strawberry, berry, vanilla, custard, chocolate, dark chocolate", colors: ["#FFF0F2", "#FFAAB8", "#FDFBEC", "#F5E8C0", "#7A3C18", "#3C1C08"] },
  { family: "ice_cream", id: "salted_caramel", label: "Salted Caramel - Cream, pale salt, caramel, deep salt, toffee dark, sea salt", colors: ["#F8F4E4", "#F0D890", "#D4A030", "#A07018", "#3C2808", "#E8E8E0"] },
  { family: "kids", id: "crayon_box", label: "Crayon Box - Crayon red, orange, sunshine, grass green, sky blue, purple", colors: ["#FF4040", "#FF9820", "#FFE020", "#40C840", "#2080FF", "#C040FF"] },
  { family: "kids", id: "playground_sky", label: "Playground Sky - Sky ice, sky blue, bright sky, cloud, sunshine, grass", colors: ["#EAF6FF", "#A8D8FF", "#3898F0", "#FFFFFF", "#FFE040", "#80E880"] },
  { family: "kids", id: "bubbly_brights", label: "Bubbly Brights - Hot pink, orange, yellow, neon mint, aqua, pure white", colors: ["#FF6090", "#FF9040", "#FFD000", "#00D880", "#00B8FF", "#FFFFFF"] },
  { family: "kids", id: "teddy_bear_picnic", label: "Teddy Bear Picnic - Honey ice, honey, teddy bear, caramel, meadow, strawberry", colors: ["#FFF4E0", "#FFD888", "#D89040", "#A06020", "#60A850", "#FF6088"] },
  { family: "kids", id: "dino_world", label: "Dino World - Jungle black, jungle, dino green, neon lime, fossil, volcano", colors: ["#0C1C10", "#1A3820", "#28A848", "#80E050", "#FFD040", "#FF5028"] },
  { family: "kids", id: "rainbow_unicorn", label: "Rainbow Unicorn - Magic white, unicorn, magic violet, candy pink, sky pop, star gold", colors: ["#FFF0FF", "#F8B8F8", "#B870FF", "#FFB0D8", "#80E8FF", "#FFE840"] },
  { family: "kids", id: "space_adventure", label: "Space Adventure - Space black, galaxy, rocket blue, star white, star gold, mars red", colors: ["#060828", "#101840", "#2030A0", "#F0F0FF", "#FFD040", "#FF5060"] },
  { family: "kids", id: "ocean_fish", label: "Ocean & Fish - Sea foam, ocean, deep sea, abyss, clownfish, starfish", colors: ["#E8F8FF", "#88D8F8", "#1898D8", "#0A3860", "#FF8030", "#FFE040"] },
  { family: "kids", id: "building_blocks", label: "Building Blocks - Red block, yellow block, green block, blue block, white block, grey base", colors: ["#FF3838", "#FFB020", "#38B838", "#1878E8", "#FFFFFF", "#F0F0F0"] },
  { family: "kids", id: "fairy_garden", label: "Fairy Garden - Fairy ice, fern, leaf, dark leaf, fairy rose, magic", colors: ["#F0FFE8", "#C0F0B0", "#60C860", "#386818", "#FF80C0", "#D080FF"] },
  { family: "kids", id: "toy_box", label: "Toy Box - Toy red, toy yellow, toy green, toy blue, toy pink, box white", colors: ["#FF4858", "#FFD820", "#30C070", "#2888FF", "#FF80F0", "#FFFFFF"] },
  { family: "kids", id: "sweet_dreams", label: "Sweet Dreams - Dream ice, lavender, dream violet, night sky, moon gold, dreamy pink", colors: ["#F0EEFF", "#C8BBF8", "#8878E8", "#3020A0", "#FFD870", "#FFB0D0"] },
] as const;

const PLAYFUL_MOOD_PRESET_IDS = ["fresh", "candy", "ice_cream", "kids"] as const;

const INTERIOR_MOOD_PALETTES = [
  { family: "home_furnishing", id: "nordic_linen", label: "Nordic Linen - Linen white, linen, warm flax, walnut, sage, soft sage", colors: ["#F4F2EC", "#E0DCD0", "#C4BFA8", "#383020", "#8CA898", "#C8D8D0"] },
  { family: "wallpaper", id: "burnt_terracotta_decor", label: "Burnt Terracotta - Clay dark, terracotta, clay, plaster, eucalyptus, sand", colors: ["#1C0C08", "#A44830", "#D08060", "#F0E0D0", "#78A890", "#E8D8B8"] },
  { family: "home_furnishing", id: "midnight_forest_decor", label: "Midnight Forest - Forest black, dark forest, forest, parchment, brass, timber", colors: ["#0E0E08", "#102818", "#1C4830", "#F0EEE4", "#C8A860", "#9A7850"] },
  { family: "wallpaper", id: "powder_bloom", label: "Powder Bloom - Petal white, powder, dusty rose, dark plum, warm sand, sage green", colors: ["#F8F2F8", "#E8D8E8", "#C8A8C8", "#402840", "#D8C8A0", "#88A898"] },
  { family: "home_furnishing", id: "slate_stone_decor", label: "Slate & Stone - Dark slate, slate, blue slate, stone white, oak, warm stone", colors: ["#0E1216", "#1E2830", "#3A4C58", "#EEF0EC", "#C8A870", "#A89880"] },
  { family: "home_furnishing", id: "warm_ivory_study", label: "Warm Ivory Study - Pure ivory, warm ivory, antique, dark oak, cognac, fern", colors: ["#F8F7EE", "#F0E8D4", "#D8C8A0", "#302018", "#8A6840", "#6A8878"] },
  { family: "wallpaper", id: "indigo_dusk_decor", label: "Indigo Dusk - Indigo black, indigo, deep indigo, linen, gold, copper", colors: ["#08081C", "#141440", "#242870", "#F2F0EC", "#E8D090", "#C89060"] },
  { family: "home_furnishing", id: "sage_cream_decor", label: "Sage & Cream - Sage dark, deep sage, sage, pale sage, cream, warm sand", colors: ["#0A1010", "#1A2C28", "#608878", "#A8C0B0", "#F4F0E8", "#D8C898"] },
  { family: "wallpaper", id: "dusty_mauve_boudoir", label: "Dusty Mauve Boudoir - Mauve black, dark mauve, mauve, petal white, gold sand, warm taupe", colors: ["#180E18", "#482838", "#907080", "#F4EEF0", "#D8C898", "#A89878"] },
  { family: "home_furnishing", id: "coastal_retreat_decor", label: "Coastal Retreat - Ocean dark, ocean, coastal, sea salt, drift sand, dune grass", colors: ["#081420", "#103048", "#3A6888", "#F0EDE4", "#D8C898", "#A8B898"] },
  { family: "wallpaper", id: "charcoal_luxe", label: "Charcoal Luxe - Near black, charcoal, dark luxe, aged white, aged gold, cognac", colors: ["#0C0C0E", "#181820", "#2C2C3C", "#F0EEE8", "#D0A838", "#805838"] },
  { family: "home_furnishing", id: "botanical_teal_decor", label: "Botanical Teal - Teal black, botanical, teal, spa white, rattan, jute", colors: ["#041410", "#0C2C28", "#4A8880", "#EEF8F4", "#D8C890", "#9A7858"] },
] as const;

const INTERIOR_MOOD_PRESET_IDS = ["home_decor", "home_furnishing", "wallpaper"] as const;
const HIDDEN_PRESET_IDS = ["home_furnishing"] as const;

const FASHION_MOOD_PALETTES = [
  { family: "mens_formal", id: "black_tie", label: "Black Tie - Jet black, onyx, charcoal, ivory, champagne, gold cuff", colors: ["#0A0A0A", "#1E1E1E", "#2E2E2E", "#F8F6F0", "#C8C0A8", "#C8A840"] },
  { family: "mens_formal", id: "navy_pinstripe", label: "Navy Pinstripe - Deep navy, navy, ink blue, crisp white, pinstripe, brass", colors: ["#080E1C", "#111E38", "#1C3058", "#FAF2EC", "#A0B0C8", "#C8A840"] },
  { family: "mens_formal", id: "charcoal_herringbone", label: "Charcoal Herringbone - Dark charcoal, charcoal, steel, linen, mist grey, oxblood", colors: ["#141618", "#242830", "#363C44", "#F0EEE8", "#9098A0", "#6A3020"] },
  { family: "mens_formal", id: "british_racing", label: "British Racing - Forest black, British racing green, racing green, cream, gold braid, tan", colors: ["#081408", "#102810", "#1C4020", "#F0EEE8", "#C8A840", "#8C6030"] },
  { family: "mens_formal", id: "midnight_tuxedo", label: "Midnight Tuxedo - Midnight, tuxedo, formal blue, dress white, pale gold, warm ash", colors: ["#080C14", "#101828", "#1C2840", "#F8F8F8", "#E8D8A0", "#A09080"] },
  { family: "mens_formal", id: "slate_boardroom", label: "Slate Boardroom - Dark slate, boardroom, slate blue, parchment, cool slate, warm khaki", colors: ["#10141C", "#1E2430", "#2E3848", "#F2F0EC", "#8090A8", "#B09878"] },
  { family: "mens_formal", id: "burgundy_club", label: "Burgundy Club - Dark burgundy, burgundy, claret, cream, old gold, dark taupe", colors: ["#180810", "#2C1020", "#461830", "#F4EEE8", "#C0A870", "#484040"] },
  { family: "mens_formal", id: "oxford_brown", label: "Oxford Brown - Oxford black, oxford brown, mahogany, linen, caramel, slate blue", colors: ["#100C08", "#201810", "#342818", "#F0E8DC", "#A89070", "#304858"] },
  { family: "mens_formal", id: "pewter_grey_suit", label: "Pewter Grey Suit - Dark pewter, pewter, mid pewter, bright white, amber, deep wine", colors: ["#141416", "#242428", "#383840", "#F0EEF0", "#C8A060", "#502828"] },
  { family: "mens_formal", id: "dark_olive_officer", label: "Dark Olive Officer - Dark olive, olive, field olive, sand, medal gold, leather", colors: ["#0C100A", "#181E10", "#282E18", "#EEEBD8", "#C8A840", "#603020"] },
  { family: "mens_formal", id: "ink_silver", label: "Ink & Silver - Ink dark, ink blue, dusk ink, silver white, silver, bronze", colors: ["#0C0E14", "#101C28", "#202C3C", "#F0F0F4", "#B0B8C8", "#A07040"] },
  { family: "mens_formal", id: "espresso_bone", label: "Espresso & Bone - Espresso, dark roast, mocha, bone, warm taupe, navy tie", colors: ["#0E0A08", "#1C1410", "#2E2018", "#F0EAE0", "#A89080", "#102840"] },
  { family: "mens_casual", id: "raw_denim", label: "Raw Denim - Raw denim, indigo, faded jeans, ecru tee, tan leather, pale camel", colors: ["#0C1828", "#1C3050", "#3A5880", "#F0EDE0", "#C89060", "#E8D8B8"] },
  { family: "mens_casual", id: "weekend_olive", label: "Weekend Olive - Dark olive, olive, field green, sand tee, khaki, rust belt", colors: ["#141A0C", "#283A18", "#4A6030", "#F0EBD8", "#D4A860", "#8C6840"] },
  { family: "mens_casual", id: "grey_melange", label: "Grey Melange - Dark melange, melange, mid grey, off white, signal red, salmon", colors: ["#181818", "#303030", "#505050", "#F0EEE8", "#F05030", "#F0B0A0"] },
  { family: "mens_casual", id: "washed_camel", label: "Washed Camel - Dark camel, camel dark, washed camel, pale camel, denim blue, sky blue", colors: ["#140E08", "#2C2010", "#7A5C30", "#F0EBD0", "#3A5880", "#A0C0D8"] },
  { family: "mens_casual", id: "street_slate", label: "Street Slate - Dark slate, slate, cool slate, light grey, amber pop, pale amber", colors: ["#0E1014", "#1C2028", "#303848", "#ECE8E0", "#E8A030", "#F8D888"] },
  { family: "mens_casual", id: "flannel_earth", label: "Flannel Earth - Dark earth, flannel brown, rust, cream, pine green, sage", colors: ["#180E08", "#301C10", "#6A3C20", "#F0E0D0", "#4A6840", "#A8C0A0"] },
  { family: "mens_casual", id: "surf_stone", label: "Surf & Stone - Deep surf, ocean, surf blue, sea salt, sandy, pale sand", colors: ["#101820", "#1C3048", "#3A6080", "#F0EDE4", "#D4B880", "#E8D4A8"] },
  { family: "mens_casual", id: "terracotta_trail", label: "Terracotta Trail - Dark terra, trail brown, terracotta, bone, trail moss, pale moss", colors: ["#160C06", "#2C1810", "#8A4828", "#F8E8D8", "#708858", "#C0D0A8"] },
  { family: "mens_casual", id: "cargo_canvas", label: "Cargo & Canvas - Dark cargo, canvas dark, cargo, canvas, work blue, sky", colors: ["#100E08", "#2E2E10", "#585D40", "#E8E0C8", "#386088", "#A0C0D8"] },
  { family: "mens_casual", id: "smoke_rust", label: "Smoke & Rust - Smoke black, smoke, dark ash, pale ash, rust, pale rust", colors: ["#141210", "#282420", "#403830", "#EEE4D8", "#C85830", "#F0B090"] },
  { family: "mens_casual", id: "alpine_hike", label: "Alpine Hike - Alpine dark, forest, alpine green, snow, honey, straw", colors: ["#0E1410", "#1C2C20", "#304838", "#EEF0E8", "#C88840", "#E8C880"] },
  { family: "mens_casual", id: "coastal_linen", label: "Coastal Linen - Coastal dark, sea navy, coastal blue, linen, sand gold, pale gold", colors: ["#0C1420", "#182840", "#3A6080", "#F4F0E4", "#D8A858", "#F0D898"] },
  { family: "mens_party", id: "midnight_glam", label: "Midnight Glam - Void, midnight, dark club, flash white, glam gold, spotlight", colors: ["#080810", "#141428", "#202040", "#F0F0FF", "#C8A800", "#FFE860"] },
  { family: "mens_party", id: "velvet_noir", label: "Velvet Noir - Noir black, velvet, deep violet, orchid white, neon violet, soft orchid", colors: ["#100810", "#201428", "#342040", "#F8F0FF", "#D040F0", "#E8A0FF"] },
  { family: "mens_party", id: "electric_cobalt", label: "Electric Cobalt - Deep ink, cobalt dark, cobalt, ice white, electric blue, neon sky", colors: ["#04080C", "#081428", "#0C2858", "#EEF4FF", "#00C0FF", "#80E8FF"] },
  { family: "mens_party", id: "champagne_smoke", label: "Champagne & Smoke - Smoke black, smoke, dark haze, champagne, liquid gold, bright gold", colors: ["#0E0C08", "#201C14", "#342E20", "#F8F0D8", "#D0A830", "#FFE070"] },
  { family: "mens_party", id: "scarlet_club", label: "Scarlet Club - Blood red, scarlet dark, scarlet, petal white, flash yellow, warm gold", colors: ["#100406", "#220810", "#480C18", "#FFF0F0", "#F0E030", "#E8B840"] },
  { family: "mens_party", id: "dark_teal_rave", label: "Dark Teal Rave - Void teal, deep teal, dark rave, ice teal, neon teal, neon pink", colors: ["#041010", "#081E1E", "#0C3030", "#E8FFFF", "#00FFD0", "#FF40A0"] },
  { family: "mens_party", id: "black_rose_gold", label: "Black & Rose Gold - Noir black, dark satin, satin, blush white, rose gold, pale rose", colors: ["#0C0808", "#1C1414", "#2C1E1E", "#FFF0EE", "#D08060", "#F0C0A8"] },
  { family: "mens_party", id: "neon_jungle", label: "Neon Jungle - Jungle black, deep jungle, dark jungle, flash green, neon green, neon yellow", colors: ["#080E08", "#101E10", "#1A3018", "#F0FFF0", "#40F040", "#F0E820"] },
  { family: "mens_party", id: "plum_silver", label: "Plum & Silver - Dark plum, plum, deep plum, soft white, silver, gold trim", colors: ["#0C0818", "#1C1030", "#2E1850", "#F5F0FF", "#D0D8E8", "#C8A800"] },
  { family: "mens_party", id: "burnished_copper_party", label: "Burnished Copper - Dark copper, burnished, dark copper, warm white, copper pop, flame gold", colors: ["#0E0806", "#1C1008", "#341808", "#FFF0E0", "#F07020", "#FFD080"] },
  { family: "mens_party", id: "night_chrome", label: "Night Chrome - Chrome black, night, dark chrome, chrome white, metallic, neon cyan", colors: ["#0A0A0C", "#181820", "#282838", "#F4F4F8", "#C0C8E0", "#00E8FF"] },
  { family: "mens_party", id: "deep_maroon_soiree", label: "Deep Maroon Soiree - Maroon black, deep maroon, soiree, petal, gold rush, pale rush", colors: ["#100610", "#200A18", "#300E28", "#FFF0F5", "#D0A820", "#F8D860"] },
  { family: "mens_ethnic", id: "royal_sherwani", label: "Royal Sherwani - Royal black, royal blue, deep royal, ivory, zari gold, pale zari", colors: ["#0C1020", "#101E40", "#1C3A68", "#F4F4E8", "#D4A820", "#F0C870"] },
  { family: "mens_ethnic", id: "saffron_kurta", label: "Saffron Kurta - Deep spice, dark saffron, saffron, cream, forest green, jade", colors: ["#1A0A00", "#3A1800", "#C85000", "#FFF0D8", "#106030", "#78C890"] },
  { family: "mens_ethnic", id: "maharaja_maroon", label: "Maharaja Maroon - Maroon black, maharaja, deep crimson, rose white, temple gold, pale gold", colors: ["#100408", "#280818", "#580C28", "#FFF0F0", "#C89018", "#EED080"] },
  { family: "mens_ethnic", id: "peacock_teal_ethnic", label: "Peacock Teal - Peacock black, dark teal, peacock, foam, zari gold, royal purple", colors: ["#041010", "#082828", "#0C4840", "#F0FCF8", "#C89018", "#8040A0"] },
  { family: "mens_ethnic", id: "ivory_bandhgala", label: "Ivory Bandhgala - Ivory, warm ivory, antique, dark walnut, gold button, rust trim", colors: ["#F8F4E8", "#EEE4C8", "#D8C898", "#282018", "#B88020", "#803828"] },
  { family: "mens_ethnic", id: "indigo_jamdani", label: "Indigo Jamdani - Indigo black, indigo, deep indigo, ecru, jamdani gold, copper", colors: ["#080C1C", "#101C3C", "#1C3070", "#F4F0E8", "#C8A818", "#E89858"] },
  { family: "mens_ethnic", id: "forest_green_achkan", label: "Forest Green Achkan - Achkan black, forest, deep forest, parchment, brocade, burgundy", colors: ["#081008", "#102010", "#1C3C1C", "#F0EEE0", "#C89820", "#803020"] },
  { family: "mens_ethnic", id: "rose_silk_nehru", label: "Rose Silk Nehru - Rose black, dark rose, silk rose, petal, gold embroidery, pale embroidery", colors: ["#180810", "#301020", "#882040", "#FFF0F4", "#C89018", "#F8D068"] },
  { family: "mens_ethnic", id: "mustard_banarasi", label: "Mustard Banarasi - Mustard dark, dark mustard, banarasi, cream gold, deep crimson, navy", colors: ["#140E00", "#2C1C00", "#A07008", "#FFF0D8", "#781830", "#1C3860"] },
  { family: "mens_ethnic", id: "charcoal_kalamkari", label: "Charcoal Kalamkari - Kalamkari black, dark charcoal, kalamkari, linen, rust print, ink green", colors: ["#10100C", "#201C18", "#383028", "#F0EBD8", "#C84820", "#1C5840"] },
  { family: "mens_ethnic", id: "regal_emerald", label: "Regal Emerald - Emerald black, dark emerald, emerald, mint cream, zari gold, deep red", colors: ["#061008", "#0C2010", "#144020", "#F0FFF4", "#D4A018", "#701828"] },
  { family: "mens_ethnic", id: "sandstone_pathani", label: "Sandstone Pathani - Desert black, sandstone, pathani, cream sand, midnight, rust motif", colors: ["#120E08", "#241C0C", "#6A5030", "#F8EED8", "#082030", "#C84818"] },
  { family: "womens_formal", id: "noir_elegance", label: "Noir Elegance - Noir, jet black, onyx, ivory, gold, champagne", colors: ["#080808", "#181818", "#282828", "#F8F6F2", "#D4AF60", "#E8D0A8"] },
  { family: "womens_formal", id: "midnight_navy_power", label: "Midnight Navy Power - Navy black, navy, deep navy, pearl, gold pearl, brass", colors: ["#06091A", "#0E1838", "#1A2C60", "#F4F2EC", "#E8D090", "#C8A860"] },
  { family: "womens_formal", id: "ivory_power_suit", label: "Ivory Power Suit - Pure ivory, warm ivory, antique, noir trim, gold button, rust", colors: ["#F8F5EC", "#EDE8D8", "#D8CEB8", "#181410", "#B88040", "#784030"] },
  { family: "womens_formal", id: "charcoal_tailored", label: "Charcoal Tailored - Dark charcoal, charcoal, steel, linen, dusty rose, pale rose", colors: ["#111318", "#202430", "#323848", "#F0EEE8", "#D08090", "#EEC0C8"] },
  { family: "womens_formal", id: "burgundy_authority", label: "Burgundy Authority - Burgundy dark, burgundy, deep wine, blush white, gold pin, taupe", colors: ["#14060C", "#280C18", "#501828", "#FFF0F0", "#C8A838", "#484040"] },
  { family: "womens_formal", id: "dove_grey", label: "Dove Grey - Dark dove, dove grey, storm, white dove, blush pink, pale pink", colors: ["#141416", "#2C2C34", "#484858", "#F2F0F4", "#D4A0B0", "#F0C8D4"] },
  { family: "womens_formal", id: "forest_bottle_green", label: "Forest Bottle Green - Bottle black, bottle, forest, pale sage, gold, pale gold", colors: ["#060E08", "#0E2010", "#1A3C22", "#EEF4EE", "#C8A030", "#F0C880"] },
  { family: "womens_formal", id: "blush_formal", label: "Blush Formal - Deep blush, blush black, blush, petal white, warm gold, pale brass", colors: ["#180C10", "#301828", "#905870", "#FFF4F8", "#CAA050", "#E8C898"] },
  { family: "womens_formal", id: "cobalt_executive", label: "Cobalt Executive - Cobalt black, cobalt, deep cobalt, ice white, gold, pale gold", colors: ["#04080E", "#081430", "#102860", "#F0F4FF", "#E0C870", "#F8E8B0"] },
  { family: "womens_formal", id: "plum_corporate", label: "Plum Corporate - Plum dark, plum, corporate plum, lavender, gold, lilac mist", colors: ["#0E0818", "#1C1030", "#3C1858", "#F8F0FF", "#C8A848", "#D0B8D8"] },
  { family: "womens_formal", id: "camel_cream", label: "Camel & Cream - Dark camel, camel, mid camel, cream, ink navy, blue grey", colors: ["#140E08", "#2C1E10", "#7A5830", "#F8ECD8", "#181C28", "#90A0B8"] },
  { family: "womens_formal", id: "slate_rose", label: "Slate Rose - Slate dark, slate, blue slate, pearl white, dusty rose, pale rose", colors: ["#0E1018", "#1C2030", "#303848", "#F2EEF0", "#C07888", "#E0B0C0"] },
  { family: "womens_casual", id: "linen_lavender", label: "Linen & Lavender - Linen ice, warm linen, mid linen, dark root, lavender, pale lavender", colors: ["#F4F0E8", "#E0D8C8", "#C0B8A0", "#302818", "#A890C8", "#D8C8E8"] },
  { family: "womens_casual", id: "terracotta_sunday", label: "Terracotta Sunday - Terra black, dark terra, terracotta, cream, sage, pale sage", colors: ["#1A0C08", "#3A1C10", "#A85838", "#FFEEDD", "#88A870", "#C8D8B0"] },
  { family: "womens_casual", id: "dusty_blue_denim", label: "Dusty Blue Denim - Denim black, dark denim, denim blue, off white, peach, pale peach", colors: ["#0A1020", "#182038", "#4A6888", "#F0EDE4", "#E8A880", "#F8D0B8"] },
  { family: "womens_casual", id: "soft_olive_everyday", label: "Soft Olive Everyday - Olive black, dark olive, olive, ecru, honey, pale honey", colors: ["#0E1008", "#1E2010", "#586838", "#F4F0E4", "#E8B870", "#F8D8A0"] },
  { family: "womens_casual", id: "blush_oat", label: "Blush & Oat - Deep blush, blush dark, blush, oat, warm sand, pale oat", colors: ["#1A0C10", "#341820", "#C07080", "#F8F2E8", "#D0C0A8", "#E8E0CC"] },
  { family: "womens_casual", id: "mint_vanilla", label: "Mint & Vanilla - Mint black, dark mint, fresh mint, vanilla, butter, pale butter", colors: ["#081410", "#102820", "#489870", "#FEFAE8", "#F0D080", "#FAE8B0"] },
  { family: "womens_casual", id: "caramel_cream", label: "Caramel & Cream - Caramel dark, dark caramel, caramel, cream, slate blue, sky mist", colors: ["#160E06", "#2C1C0C", "#A87040", "#FFF0D8", "#7898A8", "#BBD0DC"] },
  { family: "womens_casual", id: "lilac_weekend", label: "Lilac Weekend - Lilac black, dark lilac, lilac, soft white, warm peach, pale peach", colors: ["#100C18", "#201830", "#9070B8", "#F8F0FF", "#F0B898", "#FADBC0"] },
  { family: "womens_casual", id: "rust_ivory", label: "Rust & Ivory - Rust dark, deep rust, rust, ivory, olive, sage", colors: ["#160806", "#2C100A", "#B84C28", "#FFEEDD", "#486830", "#A8B890"] },
  { family: "womens_casual", id: "soft_grey_blush", label: "Soft Grey & Blush - Slate black, dark grey, soft grey, off white, blush, pale blush", colors: ["#141414", "#282828", "#505050", "#F4F0EE", "#E8A0B0", "#F8CCD8"] },
  { family: "womens_casual", id: "coastal_stripe", label: "Coastal Stripe - Ocean black, ocean blue, coastal, sea salt, sandy, pale sandy", colors: ["#08101C", "#102038", "#2A5080", "#F4F2EC", "#F0C060", "#FAE098"] },
  { family: "womens_casual", id: "charcoal_mauve_casual", label: "Charcoal & Mauve - Dark charcoal, charcoal, cool charcoal, frost, mauve, pale mauve", colors: ["#101014", "#202028", "#383848", "#F0EEF4", "#C098A8", "#DEC0CC"] },
  { family: "womens_party", id: "midnight_sequin", label: "Midnight Sequin - Void, midnight, sequin dark, crystal, sequin violet, champagne", colors: ["#080810", "#101028", "#141C48", "#F4F0FF", "#C0A0FF", "#F8D0A8"] },
  { family: "womens_party", id: "rose_gold_glam", label: "Rose Gold Glam - Dark rose, deep rose, rose gold, blush white, gold foil, pale gold", colors: ["#160A08", "#2C1410", "#A86050", "#FFF0EC", "#E8C070", "#F8D0A8"] },
  { family: "womens_party", id: "electric_fuchsia", label: "Electric Fuchsia - Dark fuchsia, fuchsia dark, deep fuchsia, petal white, neon fuchsia, flash gold", colors: ["#180010", "#300020", "#600040", "#FFF0F8", "#F040B0", "#FFD040"] },
  { family: "womens_party", id: "emerald_gown", label: "Emerald Gown - Emerald black, deep emerald, emerald, ice mint, gold trim, pale gold", colors: ["#040E08", "#082018", "#0E4830", "#F0FFF8", "#D4A820", "#F8E070"] },
  { family: "womens_party", id: "cobalt_cocktail", label: "Cobalt Cocktail - Cobalt black, deep cobalt, cobalt, frost blue, gold, candy pink", colors: ["#04080E", "#081428", "#102858", "#EEF4FF", "#F0D060", "#FFA0C8"] },
  { family: "womens_party", id: "velvet_berry", label: "Velvet Berry - Berry black, velvet, deep berry, orchid white, gold, neon mint", colors: ["#120818", "#240C30", "#601870", "#FFF0FF", "#E8C060", "#A0F0E8"] },
  { family: "womens_party", id: "champagne_glow", label: "Champagne Glow - Dark champagne, champagne, warm gold, pearl, rose blush, pale blush", colors: ["#100C06", "#221808", "#483018", "#F8F0E8", "#E8A8C8", "#F8D0EE"] },
  { family: "womens_party", id: "scarlet_drama", label: "Scarlet Drama - Deep red, scarlet dark, scarlet, ivory rose, bold gold, pale gold", colors: ["#100306", "#220810", "#580C18", "#FFF0F2", "#D4A820", "#F8D860"] },
  { family: "womens_party", id: "lilac_pop", label: "Lilac Pop - Storm black, lilac storm, violet, lilac white, hot pink, aqua pop", colors: ["#0E0A18", "#1C1430", "#4832A0", "#F5F0FF", "#FF80B0", "#A0E8FF"] },
  { family: "womens_party", id: "black_coral_pop", label: "Black & Coral Pop - Jet black, onyx, noir, flash white, coral pop, pale coral", colors: ["#080808", "#181818", "#282828", "#F8F8F4", "#FF5840", "#FFB090"] },
  { family: "womens_party", id: "teal_temptress", label: "Teal Temptress - Teal black, dark teal, teal, sea foam, warm gold, neon rose", colors: ["#041010", "#082020", "#0C4040", "#EEFFFC", "#D8B060", "#F870A8"] },
  { family: "womens_party", id: "mauve_soiree", label: "Mauve Soiree - Mauve black, deep mauve, mauve, petal, gold, soft aqua", colors: ["#140A12", "#261420", "#783058", "#FFF0F8", "#D0A848", "#80D8F0"] },
] as const;

const FASHION_MOOD_PRESET_IDS = [
  "mens_formal",
  "mens_casual",
  "mens_party",
  "mens_ethnic",
  "womens_formal",
  "womens_casual",
  "womens_party",
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
  if (preset === "monotone" || preset === "pastel" || preset === "natural" || preset === "natural_white") {
    return preset;
  }

  if (preset === "dusty" || preset === "dark_dusty") return "dark_dusty";
  if (["fresh", "candy", "ice_cream", "kids"].includes(preset)) return "pastel";
  if (preset === "mens_casual" || preset === "womens_casual") return "natural";
  if (
    preset === "mens_formal" ||
    preset === "mens_party" ||
    preset === "mens_ethnic" ||
    preset === "womens_formal" ||
    preset === "womens_party"
  ) {
    return "dark";
  }
  if (["home_decor", "home_furnishing", "wallpaper", "earthy"].includes(preset)) return "natural";
  if (preset === "dark" || preset.startsWith("dark_")) return "dark";
  return "natural";
};

const isNaturalBasicPreset = (preset: PresetId) =>
  preset === "natural" || preset === "natural_white";

const isTonalPalettePreset = (preset: PresetId) =>
  preset === "monotone" || isNaturalBasicPreset(preset);

const isDarkMoodPreset = (preset: PresetId) =>
  (DARK_MOOD_PRESET_IDS as readonly string[]).includes(preset);

const isPlayfulMoodPreset = (preset: PresetId) =>
  (PLAYFUL_MOOD_PRESET_IDS as readonly string[]).includes(preset);

const isInteriorMoodPreset = (preset: PresetId) =>
  (INTERIOR_MOOD_PRESET_IDS as readonly string[]).includes(preset);

const isFashionMoodPreset = (preset: PresetId) =>
  (FASHION_MOOD_PRESET_IDS as readonly string[]).includes(preset);

const isHiddenPreset = (preset: PresetId) =>
  (HIDDEN_PRESET_IDS as readonly string[]).includes(preset);

const getDarkMoodFamily = (preset: PresetId) => {
  if (preset === "dark_warm") return "dark_warm";
  if (preset === "dark_cool") return "dark_cool";
  if (preset === "dark_gray") return "dark_gray";
  if (preset === "dark_khaki") return "dark_khaki";
  if (preset === "dusty") return "dusty";
  if (preset === "dark_dusty") return "dark_dusty";
  return "dark";
};

const getDarkMoodOptions = (preset: PresetId) => {
  const family = getDarkMoodFamily(preset);
  return family === "dark"
    ? DARK_MOOD_PALETTES
    : DARK_MUTED_MOOD_PALETTES.filter((mood) => mood.family === family);
};

const getPlayfulMoodOptions = (preset: PresetId) =>
  PLAYFUL_MOOD_PALETTES.filter((mood) => mood.family === preset);

const getInteriorMoodOptions = (preset: PresetId) => {
  if (preset === "wallpaper") return INTERIOR_MOOD_PALETTES.filter((mood) => mood.family === "wallpaper");
  if (preset === "home_furnishing") return INTERIOR_MOOD_PALETTES.filter((mood) => mood.family === "home_furnishing");
  return INTERIOR_MOOD_PALETTES;
};

const getFashionMoodOptions = (preset: PresetId) =>
  FASHION_MOOD_PALETTES.filter((mood) => mood.family === preset);

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

const mixHexColor = (color: string, target: string, amount: number) => {
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

const getNaturalTonalPalette = (baseColor: string, preset: PresetId) => {
  const normalizedBase = normalizeHexColor(baseColor).slice(0, 7);

  if (preset === "natural_white") {
    return [
      normalizedBase,
      mixHexColor(normalizedBase, "#8E7A45", 0.22),
      mixHexColor(normalizedBase, "#F7F3EA", 0.55),
      mixHexColor(normalizedBase, "#FFFFFF", 0.72),
    ];
  }

  return [
    mixHexColor(normalizedBase, "#3A2A18", 0.35),
    normalizedBase,
    mixHexColor(normalizedBase, "#8E7A45", 0.24),
    mixHexColor(normalizedBase, "#F0E6D3", 0.38),
  ];
};

const getColorDistance = (first: string, second: string) => {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  if (!firstRgb || !secondRgb) return Number.POSITIVE_INFINITY;

  const red = firstRgb.r - secondRgb.r;
  const green = firstRgb.g - secondRgb.g;
  const blue = firstRgb.b - secondRgb.b;

  return Math.sqrt(red * red + green * green + blue * blue);
};

const dedupeColors = (colors: string[], threshold = 22) => {
  const unique: string[] = [];

  colors.forEach((color) => {
    const normalized = normalizeHexColor(color).slice(0, 7);
    if (!isValidHexColor(normalized)) return;
    if (unique.some((existing) => getColorDistance(existing, normalized) < threshold)) return;
    unique.push(normalized);
  });

  return unique;
};

const extractColorsFromImageFile = async (file: File, limit = MAX_DETECTED_IMAGE_COLORS) =>
  new Promise<string[]>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          resolve([]);
          return;
        }

        const longestEdge = Math.max(image.width, image.height) || 1;
        const scale = Math.min(1, 180 / longestEdge);
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
        const bucketSize = 24;

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3];
          if (alpha < 125) continue;

          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const key = [
            Math.round(red / bucketSize),
            Math.round(green / bucketSize),
            Math.round(blue / bucketSize),
          ].join(":");
          const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
          bucket.count += 1;
          bucket.r += red;
          bucket.g += green;
          bucket.b += blue;
          buckets.set(key, bucket);
        }

        const colors = Array.from(buckets.values())
          .sort((first, second) => second.count - first.count)
          .map((bucket) =>
            rgbToHex({
              r: bucket.r / bucket.count,
              g: bucket.g / bucket.count,
              b: bucket.b / bucket.count,
            })
          );

        resolve(dedupeColors(colors).slice(0, limit));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };

    image.src = objectUrl;
  });

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
  trailing,
  children,
}: {
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.15)] backdrop-blur-xl md:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#E11D2E]">{title}</p>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {description && <p className="mt-2 text-sm leading-6 text-[#A1A8B3]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
 
function MiniBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A1A8B3]">
      {children}
    </span>
  );
}
 
function DetailCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#2B3138] bg-[#1C2025] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#A1A8B3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

const colorMatchingFaqs = [
  {
    question: "What is the AI Color Matching Studio?",
    answer: "The AI Color Matching Studio is a production tool designed to recolor and shift colorways of textile designs. It maps original image channels onto new to target palettes.",
  },
  {
    question: "How do I select target colorways?",
    answer: "You can select from curated preset color families (Pastel, Earthy, Playful, Dark, Interior, Fashion, Ethnic) or use the custom color picker and hex text input to enter your own printing inks.",
  },
  {
    question: "Can I generate multiple variations?",
    answer: "Yes! Every generation run produces multiple colorway variations that are displayed in the results panel. You can preview, download, or reuse them as inputs.",
  },
  {
    question: "Does the tool modify the original file channels?",
    answer: "The recoloring engine generates new high-fidelity output variations of your artwork while fully preserving the underlying structure, resolution, and details.",
  },
];

type PastelMoodId = string;
type DarkMoodId = string;
type EarthyMoodId = string;
type PlayfulMoodId = string;
type InteriorMoodId = string;
type FashionMoodId = string;
type ColorMatchingAction = "preset" | "background" | "detected";
type ColorMatchingProvider = "openai" | "gemini";

const COLOR_MATCHING_MODEL_OPTIONS: Array<{
  id: ColorMatchingProvider;
  label: string;
  description: string;
}> = [
  {
    id: "openai",
    label: "GPT",
    description: "OpenAI color matching",
  },
  {
    id: "gemini",
    label: "Gemini",
    description: "Gemini color matching",
  },
];

export default function ColorMatchingStudio() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<ColorMatchingAction>("preset");
  const [selectedProvider, setSelectedProvider] = useState<ColorMatchingProvider>("openai");
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("monotone");
  const [selectedShadeIndex, setSelectedShadeIndex] = useState(0);
  const [openCategory, setOpenCategory] = useState(getPresetCategoryTitle("monotone"));
  const [selectedPastelMoodId, setSelectedPastelMoodId] = useState<PastelMoodId>(
    PASTEL_MOOD_PALETTES[0].id
  );
  const [selectedDarkMoodId, setSelectedDarkMoodId] = useState<DarkMoodId>(DARK_MOOD_PALETTES[0].id);
  const [selectedEarthyMoodId, setSelectedEarthyMoodId] = useState<EarthyMoodId>(
    EARTHY_MOOD_PALETTES[0].id
  );
  const [selectedPlayfulMoodId, setSelectedPlayfulMoodId] = useState<PlayfulMoodId>(
    PLAYFUL_MOOD_PALETTES[0].id
  );
  const [selectedInteriorMoodId, setSelectedInteriorMoodId] = useState<InteriorMoodId>(
    INTERIOR_MOOD_PALETTES[0].id
  );
  const [selectedFashionMoodId, setSelectedFashionMoodId] = useState<FashionMoodId>(
    FASHION_MOOD_PALETTES[0].id
  );
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [backgroundHexInput, setBackgroundHexInput] = useState("#FFFFFF");
  const [detectedImageColors, setDetectedImageColors] = useState<string[]>([]);
  const [detectedColorTargets, setDetectedColorTargets] = useState<Record<string, string>>({});
  const [selectedDetectedColor, setSelectedDetectedColor] = useState("");
  const [detectedColorsOpen, setDetectedColorsOpen] = useState(false);
  const [isDetectingColors, setIsDetectingColors] = useState(false);
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
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<GenerateResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPalettePickerRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  const selectedProviderLabel =
    COLOR_MATCHING_MODEL_OPTIONS.find((option) => option.id === selectedProvider)?.label ?? "GPT";
  const selectedPresetMeta = useMemo(() => getPresetMeta(selectedPreset), [selectedPreset]);
  const selectedPastelMood = useMemo(
    () => PASTEL_MOOD_PALETTES.find((mood) => mood.id === selectedPastelMoodId) ?? PASTEL_MOOD_PALETTES[0],
    [selectedPastelMoodId]
  );
  const darkMoodOptions = useMemo(() => getDarkMoodOptions(selectedPreset), [selectedPreset]);
  const selectedDarkMood = useMemo(
    () => darkMoodOptions.find((mood) => mood.id === selectedDarkMoodId) ?? darkMoodOptions[0] ?? DARK_MOOD_PALETTES[0],
    [darkMoodOptions, selectedDarkMoodId]
  );
  const selectedEarthyMood = useMemo(
    () => EARTHY_MOOD_PALETTES.find((mood) => mood.id === selectedEarthyMoodId) ?? EARTHY_MOOD_PALETTES[0],
    [selectedEarthyMoodId]
  );
  const playfulMoodOptions = useMemo(() => getPlayfulMoodOptions(selectedPreset), [selectedPreset]);
  const selectedPlayfulMood = useMemo(
    () => playfulMoodOptions.find((mood) => mood.id === selectedPlayfulMoodId) ?? playfulMoodOptions[0] ?? PLAYFUL_MOOD_PALETTES[0],
    [playfulMoodOptions, selectedPlayfulMoodId]
  );
  const interiorMoodOptions = useMemo(() => getInteriorMoodOptions(selectedPreset), [selectedPreset]);
  const selectedInteriorMood = useMemo(
    () => interiorMoodOptions.find((mood) => mood.id === selectedInteriorMoodId) ?? interiorMoodOptions[0] ?? INTERIOR_MOOD_PALETTES[0],
    [interiorMoodOptions, selectedInteriorMoodId]
  );
  const fashionMoodOptions = useMemo(() => getFashionMoodOptions(selectedPreset), [selectedPreset]);
  const selectedFashionMood = useMemo(
    () => fashionMoodOptions.find((mood) => mood.id === selectedFashionMoodId) ?? fashionMoodOptions[0] ?? FASHION_MOOD_PALETTES[0],
    [fashionMoodOptions, selectedFashionMoodId]
  );
  const currentPalette = useMemo(() => {
    if (!selectedPresetMeta) return [];
    if (selectedPreset === "pastel") return [...selectedPastelMood.colors];
    if (isDarkMoodPreset(selectedPreset)) return [...selectedDarkMood.colors];
    if (selectedPreset === "earthy") return [...selectedEarthyMood.colors];
    if (isPlayfulMoodPreset(selectedPreset)) return [...selectedPlayfulMood.colors];
    if (isInteriorMoodPreset(selectedPreset)) return [...selectedInteriorMood.colors];
    if (isFashionMoodPreset(selectedPreset)) return [...selectedFashionMood.colors];
    return selectedPresetMeta.colors;
  }, [
    selectedDarkMood.colors,
    selectedEarthyMood.colors,
    selectedFashionMood.colors,
    selectedInteriorMood.colors,
    selectedPastelMood.colors,
    selectedPlayfulMood.colors,
    selectedPreset,
    selectedPresetMeta,
  ]);
  const selectedSwatchColor = currentPalette[selectedShadeIndex] ?? currentPalette[0] ?? "#264F7A";
  const activePaletteColor = customTargetColors[selectedPreset] ?? selectedSwatchColor;
  const baseSubmittedPalette = useMemo(
    () =>
      selectedPreset === "monotone"
        ? getMonotoneTonalPalette(activePaletteColor)
        : isNaturalBasicPreset(selectedPreset)
          ? getNaturalTonalPalette(activePaletteColor, selectedPreset)
          : currentPalette,
    [activePaletteColor, currentPalette, selectedPreset]
  );
  const submittedPalette = customSubmittedPalettes[selectedPreset] ?? baseSubmittedPalette;
  const selectedColorPaletteColor =
    selectedColorPaletteIndex !== null ? submittedPalette[selectedColorPaletteIndex] : "";
  const submittedPaletteLabel =
    selectedPreset === "monotone"
      ? "monotone tonal palette"
      : selectedPreset === "natural"
        ? "natural earthy tonal palette"
        : selectedPreset === "natural_white"
          ? "natural and white tonal palette"
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
    if (!fullscreenImageUrl) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreenImageUrl(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImageUrl]);

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
    setFullscreenImageUrl(null);
    setLastResponse(null);
  };

  const resetDetectedColorState = () => {
    setDetectedImageColors([]);
    setDetectedColorTargets({});
    setSelectedDetectedColor("");
    setDetectedColorsOpen(false);
    setIsDetectingColors(false);
  };

  const detectImageColors = async (file: File) => {
    setIsDetectingColors(true);
    setDetectedImageColors([]);
    setDetectedColorTargets({});
    setSelectedDetectedColor("");
    setDetectedColorsOpen(false);

    try {
      let colors: string[] = [];

      try {
        const result = await separateColors(file);
        colors = dedupeColors(result.detected_colors ?? []).slice(0, MAX_DETECTED_IMAGE_COLORS);
      } catch {
        colors = [];
      }

      if (!colors.length) {
        colors = await extractColorsFromImageFile(file, MAX_DETECTED_IMAGE_COLORS);
      }

      const nextColors = dedupeColors(colors).slice(0, MAX_DETECTED_IMAGE_COLORS);
      const nextTargets = Object.fromEntries(nextColors.map((color) => [color, color])) as Record<string, string>;

      setDetectedImageColors(nextColors);
      setDetectedColorTargets(nextTargets);
      setSelectedDetectedColor(nextColors[0] ?? "");
      setDetectedColorsOpen(false);
      setStatus(
        nextColors.length
          ? `Detected ${nextColors.length} image color${nextColors.length > 1 ? "s" : ""}.`
          : "Image loaded. No editable colors were detected."
      );
    } catch {
      setStatus("Image loaded, but color detection could not be completed.");
    } finally {
      setIsDetectingColors(false);
    }
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
    setStatus("Image loaded. Detecting image colors...");
    void detectImageColors(file);
  };

  const handlePastelMoodChange = (moodId: string) => {
    setActiveAction("preset");
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
    setActiveAction("preset");
    const mood = darkMoodOptions.find((item) => item.id === moodId) ?? darkMoodOptions[0] ?? DARK_MOOD_PALETTES[0];

    setSelectedDarkMoodId(mood.id);
    setSelectedShadeIndex(0);
    setCustomHexInput(mood.colors[0]);
    setSelectedColorPaletteIndex(null);
    setEditingColorPaletteIndex(null);
    setEditingColorPaletteHex("");
    setCustomTargetColors((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
      return next;
    });
    setCustomSubmittedPalettes((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
      return next;
    });
  };

  const handleEarthyMoodChange = (moodId: string) => {
    setActiveAction("preset");
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

  const handlePlayfulMoodChange = (moodId: string) => {
    setActiveAction("preset");
    const mood = playfulMoodOptions.find((item) => item.id === moodId) ?? playfulMoodOptions[0] ?? PLAYFUL_MOOD_PALETTES[0];

    setSelectedPlayfulMoodId(mood.id);
    setSelectedShadeIndex(0);
    setCustomHexInput(mood.colors[0]);
    setSelectedColorPaletteIndex(null);
    setEditingColorPaletteIndex(null);
    setEditingColorPaletteHex("");
    setCustomTargetColors((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
      return next;
    });
    setCustomSubmittedPalettes((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
      return next;
    });
  };

  const handleInteriorMoodChange = (moodId: string) => {
    setActiveAction("preset");
    const mood = interiorMoodOptions.find((item) => item.id === moodId) ?? interiorMoodOptions[0] ?? INTERIOR_MOOD_PALETTES[0];

    setSelectedInteriorMoodId(mood.id);
    setSelectedShadeIndex(0);
    setCustomHexInput(mood.colors[0]);
    setSelectedColorPaletteIndex(null);
    setEditingColorPaletteIndex(null);
    setEditingColorPaletteHex("");
    setCustomTargetColors((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
      return next;
    });
    setCustomSubmittedPalettes((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
      return next;
    });
  };

  const handleFashionMoodChange = (moodId: string) => {
    setActiveAction("preset");
    const mood = fashionMoodOptions.find((item) => item.id === moodId) ?? fashionMoodOptions[0] ?? FASHION_MOOD_PALETTES[0];

    setSelectedFashionMoodId(mood.id);
    setSelectedShadeIndex(0);
    setCustomHexInput(mood.colors[0]);
    setSelectedColorPaletteIndex(null);
    setEditingColorPaletteIndex(null);
    setEditingColorPaletteHex("");
    setCustomTargetColors((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
      return next;
    });
    setCustomSubmittedPalettes((current) => {
      if (!current[selectedPreset]) return current;

      const next = { ...current };
      delete next[selectedPreset];
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
    setActiveAction("preset");
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
    setActiveAction("preset");
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
    setActiveAction("preset");
    setSelectedColorPaletteIndex(index);
    setEditingColorPaletteIndex(null);
    window.requestAnimationFrame(() => {
      colorPalettePickerRef.current?.click();
    });
  };

  const editSubmittedPaletteHex = (index: number, color: string) => {
    setActiveAction("preset");
    setSelectedColorPaletteIndex(index);
    setEditingColorPaletteIndex(index);
    setEditingColorPaletteHex(color);
  };

  const updateSubmittedPaletteColor = (value: string) => {
    setActiveAction("preset");
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
    setActiveAction("preset");
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

  const updateDetectedPaletteTarget = (sourceColor: string, value: string) => {
    setActiveAction("detected");
    const normalized = normalizeHexColor(value);
    const nextColor = isValidHexColor(normalized) ? normalized.slice(0, 7) : value.toUpperCase();

    setDetectedColorTargets((current) => ({
      ...current,
      [sourceColor]: nextColor,
    }));
    setSelectedDetectedColor(sourceColor);
  };

  const settleDetectedPaletteHex = (sourceColor: string) => {
    setActiveAction("detected");
    const rawValue = detectedColorTargets[sourceColor] || sourceColor;
    const normalized = normalizeHexColor(rawValue);

    setDetectedColorTargets((current) => ({
      ...current,
      [sourceColor]: isValidHexColor(normalized) ? normalized.slice(0, 7) : sourceColor,
    }));
  };

  const getEditedDetectedColorMappings = () =>
    detectedImageColors
      .map((source) => ({
        source: source.toUpperCase(),
        target: normalizeHexColor(detectedColorTargets[source] || ""),
      }))
      .filter((mapping) => isValidHexColor(mapping.target) && mapping.source !== mapping.target.toUpperCase())
      .map((mapping) => ({
        source: mapping.source,
        target: mapping.target.toUpperCase(),
      }));

  const getDetectedColorInstruction = (mappings: Array<{ source: string; target: string }>) => {
    const pairs = mappings.map((mapping) => `${mapping.source} to ${mapping.target}`).join(", ");

    return (
      `Change these detected image color mappings only: ${pairs}. ` +
      "For each mapping, target only pixels and motifs visually closest to the source color. " +
      "Do not recolor unrelated palette colors. Preserve the textile pattern, layout, motif edges, texture, linework, and print details."
    );
  };

  const buildFormData = () => {
    if (!selectedFile) {
      throw new Error("Please upload a textile image first.");
    }

    const prompt =
      `Match the source textile to the ${submittedPaletteLabel}. ` +
      `Use target color ${activePaletteColor} and palette ${submittedPalette.join(", ")}. ` +
      "Preserve motifs, layout, linework, texture, and print details.";

    const form = new FormData();
    form.append("file", selectedFile);
    form.append("prompt", prompt);
    form.append("provider", selectedProvider);
    form.append("edit_mode", "precise_edit");
    form.append("edit_type", "change color");
    form.append("color_preset", getBackendPreset(selectedPreset));
    form.append("target_color", activePaletteColor);
    form.append("color_palette", submittedPalette.join(", "));
    form.append("color_lock", "use the selected target color and submitted palette");
    form.append("motif_lock", "preserve motifs, layout, linework, texture, and print details");
    form.append("output_intent", "print-ready textile colorway");
    form.append("change_strength", String(DEFAULT_EDIT_STRENGTH));
    form.append("reference_strength", String(DEFAULT_REFERENCE_STRENGTH));
    form.append("prompt_strength", String(DEFAULT_PROMPT_STRENGTH));
    form.append("num_images", "1");
    form.append("enhance_prompt", "false");

    return form;
  };

  const handleGenerate = async () => {
    setActiveAction("preset");

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

  const updateBackgroundColor = (value: string) => {
    setActiveAction("background");
    setBackgroundHexInput(value.toUpperCase());

    const nextColor = normalizeHexColor(value);
    if (!isValidHexColor(nextColor)) return;

    setBackgroundColor(nextColor.slice(0, 7));
  };

  const settleBackgroundColor = () => {
    setActiveAction("background");
    const nextColor = normalizeHexColor(backgroundHexInput);

    if (!isValidHexColor(nextColor)) {
      setBackgroundHexInput(backgroundColor);
      return;
    }

    const normalized = nextColor.slice(0, 7);
    setBackgroundColor(normalized);
    setBackgroundHexInput(normalized);
  };

  const handleBackgroundGenerate = async () => {
    setActiveAction("background");

    if (!selectedFile) {
      setStatus("Please upload an image first.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setStatus("Changing background color...");
      clearResult();

      const response = await generateImage(
        buildBackgroundForm({
          file: selectedFile,
          backgroundColor,
          provider: selectedProvider,
          numImages: 1,
        })
      );
      const urls = extractOutputUrls(response);

      setLastResponse(response);
      setResultUrls(urls);
      setSelectedResultUrl(urls[0] ?? null);
      setStatus(
        urls.length
          ? `Generated ${urls.length} background update${urls.length > 1 ? "s" : ""}.`
          : "Background change finished, but no output URL was returned."
      );
    } catch (err) {
      setError(getFriendlyError(err));
      setStatus("Background change failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDetectedColorChangesGenerate = async () => {
    setActiveAction("detected");

    if (!selectedFile) {
      setStatus("Please upload an image first.");
      return;
    }

    const mappings = getEditedDetectedColorMappings();
    if (!mappings.length) {
      setError("Please change at least one detected color before generating.");
      setStatus("Detected color change needs at least one edited mapping.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setStatus(`Changing ${mappings.length} detected color${mappings.length > 1 ? "s" : ""}...`);
      clearResult();

      const form = new FormData();
      const instruction = getDetectedColorInstruction(mappings);
      form.append("file", selectedFile);
      form.append("prompt", instruction);
      form.append("provider", selectedProvider);
      form.append("edit_mode", "precise_edit");
      form.append("edit_type", "change color");
      form.append("target_element", "detected color areas");
      form.append("replacement", mappings.map((mapping) => `${mapping.source} to ${mapping.target}`).join(", "));
      form.append("preserve", "textile pattern, motif edges, linework, texture, layout, non-selected colors");
      form.append("target_color", mappings[0].target);
      form.append("color_palette", mappings.map((mapping) => mapping.target).join(", "));
      form.append("change_strength", String(DEFAULT_EDIT_STRENGTH));
      form.append("reference_strength", String(DEFAULT_REFERENCE_STRENGTH));
      form.append("prompt_strength", String(DEFAULT_PROMPT_STRENGTH));
      form.append("num_images", "1");
      form.append("enhance_prompt", "false");

      const response = await generateImage(form);
      const urls = extractOutputUrls(response);

      setLastResponse(response);
      setResultUrls(urls);
      setSelectedResultUrl(urls[0] ?? null);
      setStatus(
        urls.length
          ? `Generated ${urls.length} detected-color update${urls.length > 1 ? "s" : ""}.`
          : "Detected color change finished, but no output URL was returned."
      );
    } catch (err) {
      setError(getFriendlyError(err));
      setStatus("Detected color change failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDetectedSingleColorGenerate = async (sourceColor: string) => {
    setActiveAction("detected");

    if (!selectedFile) {
      setStatus("Please upload an image first.");
      return;
    }

    const sourceHex = normalizeHexColor(sourceColor).slice(0, 7).toUpperCase();
    const normalizedTarget = normalizeHexColor(detectedColorTargets[sourceColor] || "");

    if (!isValidHexColor(normalizedTarget)) {
      setError("Please enter a valid replacement hex color.");
      setStatus("Detected color change needs a valid hex color.");
      return;
    }

    const targetHex = normalizedTarget.slice(0, 7).toUpperCase();
    if (sourceHex === targetHex) {
      setError("Please choose a replacement color different from the detected source color.");
      setStatus("Detected color change needs a different target color.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setStatus(`Changing detected color ${sourceHex}...`);
      clearResult();

      const instruction = getDetectedColorInstruction([{ source: sourceHex, target: targetHex }]);
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("prompt", instruction);
      form.append("provider", selectedProvider);
      form.append("edit_mode", "precise_edit");
      form.append("edit_type", "change color");
      form.append("target_element", `areas matching ${sourceHex}`);
      form.append("target_color", targetHex);
      form.append("replacement", `${sourceHex} to ${targetHex}`);
      form.append("preserve", "all other colors, textile pattern, motif edges, linework, texture, layout");
      form.append("change_strength", String(DEFAULT_EDIT_STRENGTH));
      form.append("reference_strength", String(DEFAULT_REFERENCE_STRENGTH));
      form.append("prompt_strength", String(DEFAULT_PROMPT_STRENGTH));
      form.append("num_images", "1");
      form.append("enhance_prompt", "false");

      const response = await generateImage(form);
      const urls = extractOutputUrls(response);

      setLastResponse(response);
      setResultUrls(urls);
      setSelectedResultUrl(urls[0] ?? null);
      setStatus(
        urls.length
          ? `Generated ${urls.length} detected-color update${urls.length > 1 ? "s" : ""}.`
          : "Detected color change finished, but no output URL was returned."
      );
    } catch (err) {
      setError(getFriendlyError(err));
      setStatus("Detected color change failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActiveGenerate = async () => {
    if (activeAction === "background") {
      await handleBackgroundGenerate();
      return;
    }

    if (activeAction === "detected") {
      await handleDetectedColorChangesGenerate();
      return;
    }

    await handleGenerate();
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
    <div className="relative min-h-screen overflow-hidden bg-[#111315] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[520px] w-[520px] rounded-full bg-[#E11D2E]/10 blur-[160px]" />
        <div className="absolute right-[-12%] top-[8%] h-[460px] w-[460px] rounded-full bg-[#3B82F6]/8 blur-[150px]" />
        <div className="absolute bottom-[-12%] left-[18%] h-[420px] w-[420px] rounded-full bg-white/5 blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.12]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <header className="flex flex-col gap-5 border-b border-white/5 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#A1A8B3]">
              <Sparkles className="h-3.5 w-3.5 text-[#E11D2E]" />
              RDC AI Studio / Color Matching
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl">
                AI Color Matching Studio
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#A1A8B3] md:text-base">
                Textile recoloring studio for presets, detected image colors, and background-only edits.
              </p>
              <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-[#A1A8B3]">
                Preserve motifs, print details, linework, texture, and layout while changing colorways.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <AiCreditCost credits={PRESET_MATCHING_CREDIT_COST} label="Preset Matching" />
                <AiCreditCost credits={BACKGROUND_RECOLOR_CREDIT_COST} label="Background Recolor" />
                <AiCreditCost credits={PRECISE_COLOR_CHANGE_CREDIT_COST} label="Precise Color Change" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E11D2E] px-5 text-sm font-semibold text-white transition hover:bg-[#ff3347]"
            >
              <CloudUpload className="h-4 w-4" />
              Upload Design
            </button>
            <Link
              to="/ai-studio/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-[#A1A8B3] transition hover:border-[#E11D2E]/40 hover:text-white"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-4 py-3 text-sm text-[#ffb4b9]">
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
                  isDragOver ? "border-[#E11D2E] bg-[#E11D2E]/5" : "border-[#2B3138] bg-[#111315]/30 hover:border-[#E11D2E]/40 hover:bg-[#111315]/50"
                }`}
              >
                {previewUrl ? (
                  <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-white/10 bg-[#0E1012]">
                    <img src={previewUrl} alt="Source preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        resetDetectedColorState();
                        clearResult();
                        if (previewRef.current) {
                          URL.revokeObjectURL(previewRef.current);
                          previewRef.current = null;
                        }
                      }}
                      className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white transition hover:bg-[#E11D2E]"
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#A1A8B3]">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-white">Drop textile image here</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#A1A8B3]">
                        PNG · JPG · JPEG · WEBP · BMP · TIF · TIFF
                      </p>
                      <p className="mt-2 text-[11px] text-[#6B7280]">
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
              title="02 - Model"
              description="Choose which image model should run color matching for presets, detected colors, and background edits."
            >
              <div className="grid grid-cols-2 gap-2">
                {COLOR_MATCHING_MODEL_OPTIONS.map((option) => {
                  const active = selectedProvider === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedProvider(option.id)}
                      className={`min-h-[72px] rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-[#E11D2E]/50 bg-[#E11D2E]/10 text-white shadow-[0_0_0_1px_rgba(225,29,46,0.16)]"
                          : "border-white/10 bg-[#111315]/45 text-[#A1A8B3] hover:border-white/20 hover:text-white"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-[#A1A8B3]">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="03 - Detected Colors"
              description="Detected image colors appear here after upload. Edit targets and change one color or all edited mappings."
              trailing={
                <AiCreditCost credits={PRECISE_COLOR_CHANGE_CREDIT_COST} label="Precise Color Change" />
              }
            >
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111315]/40">
                <button
                  type="button"
                  onClick={() => setDetectedColorsOpen((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
                  aria-expanded={detectedColorsOpen}
                >
                  <div>
                    <span className="block text-sm font-semibold text-white">Detected Image Colors</span>
                    <span className="mt-1 block text-[11px] text-[#A1A8B3]">
                      {isDetectingColors
                        ? "Scanning uploaded image..."
                        : detectedImageColors.length
                          ? `${detectedImageColors.length} color${detectedImageColors.length === 1 ? "" : "s"} found`
                          : selectedFile
                            ? "No editable colors detected yet"
                            : "Upload an image to scan colors"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A1A8B3]">
                      {selectedDetectedColor || "-"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#A1A8B3] transition-transform ${detectedColorsOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {detectedColorsOpen && (
                  <div className="border-t border-white/10 p-4">
                    {isDetectingColors ? (
                      <div className="rounded-2xl border border-white/10 bg-[#0E1012] p-4 text-sm text-[#A1A8B3]">
                        Detecting colors from the uploaded image...
                      </div>
                    ) : detectedImageColors.length ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                          {detectedImageColors.map((color) => (
                            <button
                              key={`detected-swatch-${color}`}
                              type="button"
                              onClick={() => {
                                setActiveAction("detected");
                                setSelectedDetectedColor(color);
                              }}
                              className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                                selectedDetectedColor === color
                                  ? "border-[#E11D2E]/50 bg-[#E11D2E]/10"
                                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
                              }`}
                              aria-label={`Detected color ${color}`}
                            >
                              <span className="h-7 w-7 rounded-lg border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
                              <span className="truncate text-[10px] font-semibold uppercase text-[#A1A8B3]">{color}</span>
                            </button>
                          ))}
                        </div>

                        <div className="space-y-3">
                          {detectedImageColors.map((color) => {
                            const targetValue = detectedColorTargets[color] || color;
                            return (
                              <div
                                key={`detected-editor-${color}`}
                                className={`rounded-2xl border p-3 transition ${
                                  selectedDetectedColor === color
                                    ? "border-[#E11D2E]/40 bg-[#E11D2E]/10"
                                    : "border-white/10 bg-[#0E1012]"
                                }`}
                                onClick={() => {
                                  setActiveAction("detected");
                                  setSelectedDetectedColor(color);
                                }}
                              >
                                <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_44px_auto] sm:items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="h-9 w-9 rounded-xl border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A1A8B3]">
                                      {color}
                                    </span>
                                  </div>

                                  <input
                                    type="text"
                                    value={targetValue}
                                    onChange={(event) => updateDetectedPaletteTarget(color, event.target.value)}
                                    onBlur={() => settleDetectedPaletteHex(color)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") event.currentTarget.blur();
                                    }}
                                    className="h-10 min-w-0 rounded-xl border border-white/10 bg-[#111315] px-3 text-sm font-semibold uppercase text-white outline-none transition focus:border-[#E11D2E]/50"
                                    aria-label={`Replacement hex for ${color}`}
                                  />

                                  <input
                                    type="color"
                                    value={isValidHexColor(targetValue) ? targetValue.slice(0, 7) : color}
                                    onChange={(event) => updateDetectedPaletteTarget(color, event.target.value)}
                                    className="h-10 w-11 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
                                    aria-label={`Pick replacement for ${color}`}
                                  />

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleDetectedSingleColorGenerate(color);
                                    }}
                                    disabled={!selectedFile || isGenerating}
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#E11D2E] px-3 text-xs font-semibold text-white transition hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Change
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleDetectedColorChangesGenerate()}
                          disabled={!selectedFile || isGenerating || getEditedDetectedColorMappings().length === 0}
                          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E11D2E] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Change All Edited Colors ({getEditedDetectedColorMappings().length})
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-[#0E1012] p-4 text-sm leading-6 text-[#A1A8B3]">
                        Upload complete, but no editable colors were detected yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
 
            <SectionCard
              title="04 - Quick Presets"
              description="Select a preset and tweak individual swatches if needed."
              trailing={<AiCreditCost credits={PRESET_MATCHING_CREDIT_COST} label="Preset Matching" />}
            >
              <div className="space-y-3">
                {PRESET_CATEGORIES.map((category) => {
                  const isOpen = openCategory === category.title;
                  const visiblePresets = category.presets.filter((preset) => !isHiddenPreset(preset.id));
                  const isSelectedCategory = visiblePresets.some((preset) => preset.id === selectedPreset);
 
                  return (
                    <div key={category.title} className="overflow-hidden rounded-lg border border-white/10 bg-[#111315]/40 p-1">
                      <button
                        type="button"
                        onClick={() => setOpenCategory((current) => (current === category.title ? "" : category.title))}
                        className="flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
                      >
                        <span className="text-[12px] font-bold uppercase tracking-wider text-white">
                          {category.title}
                        </span>
                        <ChevronDown
                          className={`h-3 w-3 text-[#6B7280] transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-1 pb-1">
                          <div className="grid grid-cols-2 gap-2">
                            {visiblePresets.map((preset) => {
                              const active = selectedPreset === preset.id;
 
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveAction("preset");
                                    setSelectedPreset(preset.id);
                                    setSelectedShadeIndex(0);
                                    setOpenCategory(category.title);
                                  }}
                                  className={`flex min-h-[60px] flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition ${
                                    active
                                      ? "border-[#E11D2E]/40 bg-[#E11D2E]/10"
                                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                                  }`}
                                >
                                  <span
                                    className="h-7 w-7 rounded-full border border-black/10 shadow-sm"
                                    style={{ background: getPresetSwatchBackground(preset.colors) }}
                                  />
                                  <span className="mt-1 text-[11px] font-semibold text-white">
                                    {preset.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
 
                          {isSelectedCategory && (
                            <div className="mt-2 rounded-md border border-white/10 bg-[#0E1012] p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {selectedPresetMeta?.label ?? "Monotone"}
                                  </p>
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#A1A8B3]">
                                    {activePaletteColor}
                                  </p>
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.18em] text-[#A1A8B3]">
                                  color_palette
                                </span>
                              </div>
 
                              {selectedPreset === "pastel" && (
                                <div className="mt-3 rounded-md border border-white/10 bg-[#111315]/50 p-3">
                                  <p className="text-sm font-semibold text-white">Pastel Palette</p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#A1A8B3]">
                                    Only colors will change. Pattern, layout, and print details stay preserved.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="text-xs text-[#A1A8B3]">Start from mood</span>
                                    <select
                                      value={selectedPastelMoodId}
                                      onChange={(event) => handlePastelMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-white/10 bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
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
 
                              {isDarkMoodPreset(selectedPreset) && (
                                <div className="mt-3 rounded-md border border-white/10 bg-[#111315]/50 p-3">
                                  <p className="text-sm font-semibold text-white">
                                    {selectedPresetMeta?.label ?? "Dark"} Palette
                                  </p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#A1A8B3]">
                                    Choose a predefined {(selectedPresetMeta?.label ?? "dark").toLowerCase()} mood, or tune the palette colors manually.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="text-xs text-[#A1A8B3]">Start from mood</span>
                                    <select
                                      value={selectedDarkMood.id}
                                      onChange={(event) => handleDarkMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-white/10 bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
                                      aria-label="Select dark mood"
                                    >
                                      {darkMoodOptions.map((mood) => (
                                        <option key={mood.id} value={mood.id}>
                                          {mood.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              )}

                              {selectedPreset === "earthy" && (
                                <div className="mt-3 rounded-md border border-white/10 bg-[#111315]/50 p-3">
                                  <p className="text-sm font-semibold text-white">Earthy Palette</p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#A1A8B3]">
                                    Choose an earthy light-base mood with natural contrast colors, or tune the palette manually.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="text-xs text-[#A1A8B3]">Start from mood</span>
                                    <select
                                      value={selectedEarthyMoodId}
                                      onChange={(event) => handleEarthyMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-white/10 bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
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
 
                              {isPlayfulMoodPreset(selectedPreset) && (
                                <div className="mt-3 rounded-md border border-white/10 bg-[#111315]/50 p-3">
                                  <p className="text-sm font-semibold text-white">
                                    {selectedPresetMeta?.label ?? "Bright"} Palette
                                  </p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#A1A8B3]">
                                    Choose a {(selectedPresetMeta?.label ?? "bright").toLowerCase()} mood with playful contrast colors.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="text-xs text-[#A1A8B3]">Start from mood</span>
                                    <select
                                      value={selectedPlayfulMood.id}
                                      onChange={(event) => handlePlayfulMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-white/10 bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
                                      aria-label="Select bright playful mood"
                                    >
                                      {playfulMoodOptions.map((mood) => (
                                        <option key={mood.id} value={mood.id}>
                                          {mood.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              )}
 
                              {isInteriorMoodPreset(selectedPreset) && (
                                <div className="mt-3 rounded-md border border-white/10 bg-[#111315]/50 p-3">
                                  <p className="text-sm font-semibold text-white">
                                    {selectedPresetMeta?.label ?? "Interior"} Palette
                                  </p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#A1A8B3]">
                                    Choose an interior mood with room bases and furnishing or wallpaper accent colors.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="text-xs text-[#A1A8B3]">Start from mood</span>
                                    <select
                                      value={selectedInteriorMood.id}
                                      onChange={(event) => handleInteriorMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-white/10 bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
                                      aria-label="Select natural interior mood"
                                    >
                                      {interiorMoodOptions.map((mood) => (
                                        <option key={mood.id} value={mood.id}>
                                          {mood.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              )}
 
                              {isFashionMoodPreset(selectedPreset) && (
                                <div className="mt-3 rounded-md border border-white/10 bg-[#111315]/50 p-3">
                                  <p className="text-sm font-semibold text-white">
                                    {selectedPresetMeta?.label ?? "Fashion"} Palette
                                  </p>
                                  <p className="mt-1 text-[11px] leading-4 text-[#A1A8B3]">
                                    Choose a fashion mood with apparel base colors, accents, and highlights from the reference palette.
                                  </p>
                                  <label className="mt-3 grid gap-1">
                                    <span className="text-xs text-[#A1A8B3]">Start from mood</span>
                                    <select
                                      value={selectedFashionMood.id}
                                      onChange={(event) => handleFashionMoodChange(event.target.value)}
                                      className="h-9 w-full rounded-md border border-white/10 bg-[#111315] px-3 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
                                      aria-label="Select fashion apparel mood"
                                    >
                                      {fashionMoodOptions.map((mood) => (
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
                                        ? "border-[#E11D2E] shadow-[0_0_0_2px_rgba(225,29,70,0.22)]"
                                        : "border-white/20 hover:border-white/40"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select shade ${index + 1}`}
                                  />
                                ))}
                              </div>
 
                              {selectedPreset !== "pastel" &&
                                !isDarkMoodPreset(selectedPreset) &&
                                selectedPreset !== "earthy" &&
                                !isPlayfulMoodPreset(selectedPreset) &&
                                !isInteriorMoodPreset(selectedPreset) &&
                                !isFashionMoodPreset(selectedPreset) && (
                                <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_44px_auto] items-center gap-2">
                                  <span className="text-xs leading-4 text-[#A1A8B3]">Custom color</span>
 
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
                                    className="h-9 min-w-0 rounded-md border border-white/10 bg-[#0E1012] px-3 text-sm font-semibold uppercase text-white outline-none transition focus:border-[#E11D2E]/40"
                                    aria-label="Custom color hex"
                                  />
 
                                  <input
                                    type="color"
                                    value={isValidHexColor(activePaletteColor) ? activePaletteColor.slice(0, 7) : "#000000"}
                                    onChange={(event) => updateCustomTargetColor(event.target.value)}
                                    className="h-9 w-11 cursor-pointer rounded-md border border-white/10 bg-transparent p-1"
                                    aria-label="Pick custom color"
                                  />
 
                                  <button
                                    type="button"
                                    onClick={() => void handleGenerate()}
                                    disabled={!selectedFile || isGenerating}
                                    className="inline-flex h-9 items-center justify-center rounded-md bg-[#E11D2E] px-3 text-xs font-semibold text-white transition hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isGenerating ? "Generating" : "Generate"}
                                  </button>
                                </div>
                              )}
 
                              <div className="mt-3 rounded-md border border-white/10 bg-[#0E1012] p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-white">
                                    {isDarkMoodPreset(selectedPreset)
                                      ? `Your ${selectedPresetMeta?.label ?? "Dark"} Colors`
                                      : selectedPreset === "earthy"
                                        ? "Your Earthy Colors"
                                        : isPlayfulMoodPreset(selectedPreset)
                                          ? `Your ${selectedPresetMeta?.label ?? "Bright"} Colors`
                                          : isInteriorMoodPreset(selectedPreset)
                                            ? `Your ${selectedPresetMeta?.label ?? "Interior"} Colors`
                                            : isFashionMoodPreset(selectedPreset)
                                              ? `Your ${selectedPresetMeta?.label ?? "Fashion"} Colors`
                                              : `Your ${selectedPresetMeta?.label ?? "Preset"} Palette`}
                                  </p>
                                  <span className="text-[9px] uppercase tracking-[0.16em] text-[#A1A8B3]">
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
                                          ? "border-[#E11D2E] shadow-[0_0_0_2px_rgba(225,29,70,0.22)]"
                                          : "border-white/20 hover:border-white/40"
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
                                        className="h-[26px] min-w-0 rounded-sm border border-[#E11D2E] bg-[#111315] px-1 py-1 text-center text-[10px] font-semibold uppercase text-white outline-none"
                                        aria-label={`Edit color palette hex ${index + 1}`}
                                        autoFocus
                                      />
                                    ) : (
                                      <button
                                        key={`${selectedPreset}-your-palette-code-${index}`}
                                        type="button"
                                        onClick={() => editSubmittedPaletteHex(index, color)}
                                        className={`truncate rounded-sm border px-1 py-1 text-center text-[10px] font-semibold uppercase transition ${
                                          selectedColorPaletteIndex === index
                                            ? "border-[#E11D2E]/40 bg-[#E11D2E]/10 text-white"
                                            : "border-white/10 bg-[#111315]/40 text-[#A1A8B3] hover:border-white/20"
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
                                <p className="mt-3 text-[10px] leading-5 text-[#A1A8B3]">
                                  {submittedPaletteLabel}: {submittedPalette.join(", ")}
                                </p>
                                <p className="mt-2 text-[10px] leading-5 text-[#6B7280]">
                                  {isTonalPalettePreset(selectedPreset)
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
            <div className="rounded-[24px] border border-[#2B3138] bg-[#181B1F]/92 p-5 text-white shadow-2xl backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#A1A8B3]">
                    <Palette className="h-4 w-4 text-[#E11D2E]" />
                    Results
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {selectedFile ? "Preview and outputs" : "Upload an image to begin"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#A1A8B3]">{status}</p>
                </div>
 
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void handleActiveGenerate()}
                    disabled={!selectedFile || isGenerating}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E11D2E] px-5 text-sm font-semibold text-white transition hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wand2 className="h-4 w-4" />
                    {isGenerating
                      ? "Generating"
                      : activeAction === "background"
                        ? "Change Background"
                        : activeAction === "detected"
                          ? "Change Colors"
                          : "Generate"}
                  </button>
                  <MiniBadge>
                    {activeAction === "background"
                      ? "Background Mode"
                      : activeAction === "detected"
                        ? "Detected Color Mode"
                        : "Preset Mode"}
                  </MiniBadge>
                  <MiniBadge>{selectedProviderLabel}</MiniBadge>
                  {selectedPresetMeta?.label && <MiniBadge>{selectedPresetMeta.label}</MiniBadge>}
                  {lastResponse?.model && <MiniBadge>{lastResponse.model}</MiniBadge>}
                  {lastResponse?.fallback_used && (
                    <span className="rounded-full border border-[#E11D2E]/20 bg-[#E11D2E]/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#ffb4b9]">
                      Fallback Used
                    </span>
                  )}
                </div>
              </div>
 
              <div className="mt-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111315]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#A1A8B3]">
                      Source
                    </span>
                    {selectedFile && (
                      <span className="text-[10px] uppercase tracking-[0.24em] text-[#6B7280]">
                        {selectedFile.name}
                      </span>
                    )}
                  </div>
                  <div className="relative min-h-[360px] bg-black/25 p-4">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Source preview" className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full min-h-[360px] items-center justify-center text-center text-sm text-[#6B7280]">
                        <div className="space-y-2">
                          <ImageIcon className="mx-auto h-10 w-10 text-[#E11D2E]" />
                          <p>Upload an image to begin.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
 
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111315]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#A1A8B3]">
                      Output
                    </span>
                    {selectedResultUrl && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleReuseGeneratedImage(selectedResultUrl)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A1A8B3] transition hover:border-[#E11D2E]/40 hover:text-white"
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
                          className="inline-flex items-center gap-2 rounded-full border border-[#E11D2E]/30 bg-[#E11D2E]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffb4b9] transition hover:border-[#E11D2E]/50 hover:bg-[#E11D2E]/20 hover:text-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative min-h-[360px] bg-black/25 p-4">
                    {selectedResultUrl ? (
                      <button
                        type="button"
                        onClick={() => setFullscreenImageUrl(selectedResultUrl)}
                        className="group relative flex h-full min-h-[360px] w-full items-center justify-center overflow-hidden rounded-2xl border border-transparent transition hover:border-[#E11D2E]/40"
                        aria-label="Open generated output fullscreen"
                      >
                        <img src={selectedResultUrl} alt="Generated output" className="h-full w-full object-contain" />
                        <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 transition group-hover:opacity-100">
                          <Maximize2 className="h-3.5 w-3.5" />
                          Fullscreen
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-full min-h-[360px] items-center justify-center text-center text-sm text-[#6B7280]">
                        <div className="space-y-2">
                          <Wand2 className="mx-auto h-10 w-10 text-[#E11D2E]" />
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
                    <div
                      key={`${url}-${index}`}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        selectedResultUrl === url
                          ? "border-[#E11D2E]/50 bg-white/8"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedResultUrl(url);
                          setFullscreenImageUrl(url);
                        }}
                        className="group relative block w-full overflow-hidden"
                        aria-label={`Open output variation ${index + 1} fullscreen`}
                      >
                        <img src={url} alt={`Output ${index + 1}`} className="h-36 w-full object-cover transition group-hover:scale-[1.02]" />
                        <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white opacity-0 transition group-hover:opacity-100">
                          <Maximize2 className="h-4 w-4" />
                        </span>
                      </button>
                      <div className="flex items-center justify-between gap-3 px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedResultUrl(url)}
                          className="min-w-0 text-left"
                        >
                          <p className="text-sm font-semibold text-white">Variation {index + 1}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#A1A8B3]">
                            {selectedPresetMeta?.label ?? "Custom"}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDownload(url, `ai-color-matching-${index + 1}.png`)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A1A8B3] transition hover:border-[#E11D2E]/40 hover:text-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Save
                        </button>
                      </div>
                    </div>
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

            <SectionCard
              title="05 - Background"
              description="Only background color changes. Motifs, print details, foreground colors, and linework stay preserved."
              trailing={<AiCreditCost credits={BACKGROUND_RECOLOR_CREDIT_COST} label="Background Recolor" />}
            >
              <div className="rounded-[24px] border border-white/10 bg-[#111315]/40 p-4">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <p className="text-base font-semibold text-white">White Background</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#A1A8B3]">
                      Choose a white base or enter a custom background hex.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A1A8B3]">
                    {backgroundColor}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {BACKGROUND_WHITE_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setActiveAction("background");
                        setBackgroundColor(color);
                        setBackgroundHexInput(color);
                      }}
                      className={`h-14 rounded-2xl border transition ${
                        backgroundColor === color
                          ? "border-[#E11D2E] shadow-[0_0_0_2px_rgba(225,29,46,0.22)]"
                          : "border-white/10 bg-white/5 hover:border-[#E11D2E]/50"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select background ${color}`}
                    />
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-sm font-semibold text-white" htmlFor="background-color-hex">
                    Background color
                  </label>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_52px] gap-3">
                    <input
                      id="background-color-hex"
                      type="text"
                      value={backgroundHexInput}
                      onChange={(event) => updateBackgroundColor(event.target.value)}
                      onBlur={settleBackgroundColor}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                      placeholder="#FFFFFF"
                      className="h-11 rounded-xl border border-white/10 bg-[#111315]/70 px-4 text-sm font-semibold uppercase text-white outline-none transition focus:border-[#E11D2E]/60"
                      aria-label="Background hex color"
                    />
                    <input
                      type="color"
                      value={isValidHexColor(backgroundColor) ? backgroundColor.slice(0, 7) : "#FFFFFF"}
                      onChange={(event) => updateBackgroundColor(event.target.value)}
                      className="h-11 w-[52px] cursor-pointer rounded-xl border border-white/10 bg-white/5 p-1"
                      aria-label="Pick background color"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleBackgroundGenerate()}
                  disabled={!selectedFile || isGenerating}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E11D2E] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Changing Background" : "Change Background"}
                </button>
              </div>
            </SectionCard>
          </section>
        </main>
      </div>

      <AnimatePresence>
        {fullscreenImageUrl && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImageUrl(null)}
          >
            <motion.div
              className="relative flex h-full w-full max-w-7xl flex-col gap-3"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Generated Preview</p>
                  <p className="mt-1 text-xs text-[#A1A8B3]">{selectedPresetMeta?.label ?? "Custom"} output</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleReuseGeneratedImage(fullscreenImageUrl)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-xs font-semibold text-white transition hover:border-[#E11D2E]/40 hover:bg-white/15"
                  >
                    <Upload className="h-4 w-4" />
                    Use as Input
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleDownload(
                        fullscreenImageUrl,
                        `ai-color-matching-${selectedPresetMeta?.id || "output"}.png`
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E11D2E]/30 bg-[#E11D2E]/15 px-4 text-xs font-semibold text-white transition hover:bg-[#E11D2E]/25"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreenImageUrl(null)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:border-[#E11D2E]/40 hover:bg-white/15"
                    aria-label="Close fullscreen preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0E1012]">
                <img
                  src={fullscreenImageUrl}
                  alt="Generated output fullscreen"
                  className="h-full w-full object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotional Info / Description Sections */}
      <div className="mt-16 space-y-20 border-t border-[#2B3138]/40 pt-16 pb-8 max-w-7xl mx-auto w-full px-6">
        {/* Section 1: AI Color Matching Studio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              AI Color Matching Studio
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Explore dynamic, production-ready color shifting. The AI Color Matching engine automatically aligns original design channels to your new target palettes, maintaining tone depth, texture layers, and printing ink coverage constraints.
            </p>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              By mapping and shifting colors across selected families, you can output clean variations of any textile pattern in seconds, matching your showroom display palettes or seasonal collection lookbooks.
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

        {/* Section 2: Palette Harmonization */}
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
              Palette Harmonization
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Achieve absolute consistency. Select from our curated preset families—including Pastel, Earthy, Playful, Dark, Interior, Fashion, or Ethnic styles—or type custom color lists. The AI maps contrast boundaries dynamically, ensuring every colorway option remains balanced and ready for rotary screenprinting.
            </p>
          </div>
        </div>

        {/* Section 3: Dynamic Variation Generation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Dynamic Variation Generation
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Upload your design asset, choose a color mood or enter a custom list of inks, and hit generate. The studio produces multiple output variations side-by-side. You can expand variations, compare details, and download high-resolution files.
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
      <div className="mt-12 border-t border-[#2B3138]/40 pt-10 pb-8 max-w-6xl mx-auto w-full px-6">
        <h2 className="text-2xl font-extrabold text-center text-white tracking-tight mb-8">
          AI Color Matching Studio: FAQs
        </h2>
        <div className="space-y-0">
          {colorMatchingFaqs.map((faq, index) => {
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
