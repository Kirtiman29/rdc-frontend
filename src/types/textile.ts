export type PresetId =
  | "monotone"
  | "pastel"
  | "dark"
  | "dark_warm"
  | "dark_cool"
  | "dark_gray"
  | "dark_khaki"
  | "dusty"
  | "dark_dusty"
  | "fresh"
  | "candy"
  | "ice_cream"
  | "kids"
  | "home_decor"
  | "home_furnishing"
  | "wallpaper"
  | "earthy"
  | "mens_formal"
  | "mens_casual"
  | "mens_party"
  | "mens_ethnic"
  | "womens_formal"
  | "womens_casual"
  | "womens_party"
  | "natural"
  | "natural_white";

export type PresetCategory = {
  title: string;
  presets: Array<{
    id: PresetId;
    label: string;
    colors: string[];
  }>;
};

export type GenerateResponse = {
  output_url?: string;
  image_urls?: string[];
  edit_mode?: string;
  edit_options?: Record<string, unknown>;
  model?: string;
  prompt_enhanced?: boolean;
  fallback_used?: boolean;
  final_prompt?: string;
  detail?: string;
  message?: string;
  error?: string;
  remainingCredits?: number;
};

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    title: "Core Palettes",
    presets: [
      { id: "monotone", label: "Monotone", colors: ["#264F7A", "#7A2F4F", "#2D6B5C", "#B06A43", "#3A3A3A"] },
      { id: "pastel", label: "Pastel", colors: ["#F9C6D0", "#C8E6F5", "#D4F1C8"] },
      { id: "dark", label: "Dark", colors: ["#1A1A2E", "#4A1942"] },
      { id: "earthy", label: "Earthy", colors: ["#F8EED0", "#D4A870", "#8B4010", "#3C2A10"] },
    ],
  },
  {
    title: "Dark & Muted",
    presets: [
      { id: "dark_warm", label: "Dark Warm", colors: ["#160B07", "#3A1710", "#6B2A18", "#9A4F24"] },
      { id: "dark_cool", label: "Dark Cool", colors: ["#010D18", "#0A3050", "#5BC8F5", "#00FFD1"] },
      { id: "dark_gray", label: "Dark Gray", colors: ["#0E0E0E", "#2C2C2C", "#A8A8A8", "#DCDCDC"] },
      { id: "dark_khaki", label: "Dark Khaki", colors: ["#100E08", "#302C1C", "#8C7E58", "#EDE0C4"] },
      { id: "dusty", label: "Dusty", colors: ["#1A0E0E", "#3C2424", "#A87070", "#DDB8B8"] },
      { id: "dark_dusty", label: "Dusty Dark", colors: ["#191018", "#3A2431", "#745564", "#C3A3AE"] },
    ],
  },
  {
    title: "Bright & Playful",
    presets: [
      { id: "fresh", label: "Fresh", colors: ["#E8FBF0", "#2ECC80", "#FFE840", "#28A8F5"] },
      { id: "candy", label: "Candy", colors: ["#FF80C0", "#AFE0FF", "#FFE840", "#FF4080"] },
      { id: "ice_cream", label: "Ice Cream", colors: ["#FDFBEC", "#F0D890", "#A87030", "#F8A0C8"] },
      { id: "kids", label: "Kids", colors: ["#FF4040", "#FFE020", "#40C840", "#2080FF"] },
    ],
  },
  {
    title: "Natural & Interior",
    presets: [
      { id: "home_decor", label: "Home Decor", colors: ["#F4F2EC", "#C4BFA8", "#383020", "#8CA898"] },
      { id: "home_furnishing", label: "Home Furnishing", colors: ["#F4F2EC", "#C4BFA8", "#383020", "#8CA898"] },
      { id: "wallpaper", label: "Wallpaper", colors: ["#A44830", "#F0E0D0", "#78A890", "#E8D8B8"] },
    ],
  },
  {
    title: "Fashion & Apparel",
    presets: [
      { id: "mens_formal", label: "Men's Formal", colors: ["#0A0A0A", "#1E1E1E", "#F8F6F0", "#C8A840"] },
      { id: "mens_casual", label: "Men's Casual", colors: ["#0C1828", "#1C3050", "#C89060", "#E8D8B8"] },
      { id: "mens_party", label: "Men's Party", colors: ["#080810", "#202040", "#C8A800", "#FFE860"] },
      { id: "mens_ethnic", label: "Men's Ethnic", colors: ["#0C1020", "#1C3A68", "#D4A820", "#F0C870"] },
      { id: "womens_formal", label: "Women's Formal", colors: ["#080808", "#282828", "#F8F6F2", "#D4AF60"] },
      { id: "womens_casual", label: "Women's Casual", colors: ["#F4F0E8", "#D8C0BA", "#302818", "#A890C8"] },
      { id: "womens_party", label: "Women's Party", colors: ["#080810", "#141C48", "#C0A0FF", "#F8D0A8"] },
    ],
  },
  {
    title: "Natural Basics",
    presets: [
      { id: "natural", label: "Natural", colors: ["#6F8F72", "#A9794B", "#D8C3A5", "#7D6B55", "#B08A5A"] },
      { id: "natural_white", label: "Natural + White", colors: ["#F7F3EA", "#6F8F72", "#A9794B", "#D8C3A5", "#B08A5A"] },
    ],
  },
];