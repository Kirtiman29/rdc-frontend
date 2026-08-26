import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Maximize,
  Palette,
  Play,
  Search,
  Sparkles,
  SwatchBook,
  Wand2,
  Video,
  Zap,
  KeyRound,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  ChevronDown,
  HelpCircle,
  Paintbrush,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getToken } from "@/api/apiClient";
import {
  EMPTY_SUBSCRIPTION_SUMMARY,
  getMySubscription,
  getRemainingDesigns,
  hasActiveSubscription,
  type UserSubscriptionSummary,
} from "@/api/subscriptionApi";

import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";
import pattern5 from "@/assets/sample-pattern-5.jpg";
import pattern6 from "@/assets/sample-pattern-6.jpg";

import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";

const chapter1Tools = [
  {
    id: "generate",
    title: "Pattern Generator",
    description: "Our core generative engine. Create seamless repeats, convert source sketch files into printable formats, configure placement guidelines, and export high-res repeat tiles.",
    icon: Wand2,
    badge: "SDXL & LORA",
    cost: "10 Credits",
    to: "/ai-studio/generate",
    image: pattern1,
    features: [
      "Generate fully seamless tile boundaries",
      "Upload sketch files for bitmap conversion",
      "Custom placement guidelines & padding controls"
    ],
    accentColor: "#E11D2E"
  },
  {
    id: "gemini-text-to-image",
    title: "Text to Pattern (Gemini)",
    description: "Utilize Google's advanced multimodal Gemini model. Generate detailed florals, historic paisleys, ikat weaves, and digital vector patterns straight from descriptive prompts.",
    icon: Sparkles,
    badge: "Gemini 1.5 Pro",
    cost: "10 Credits",
    to: "/ai-studio/gemini-text-to-image",
    image: pattern2,
    features: [
      "Interpret detailed textile descriptions",
      "Generate in multiple aspect layouts",
      "Support multilingual prompt formats"
    ],
    accentColor: "#3B82F6"
  }
];

const chapter2Tools = [
  {
    id: "gemini-image-mix",
    title: "Pattern Mixer & Effects",
    description: "Blend distinct pattern inputs or textures into coordinating concept collections. Apply post-render design filters like screen-print overlays or hand-painted watercolor textures.",
    icon: Layers,
    badge: "Multimodal Fusion",
    cost: "15 Credits",
    to: "/ai-studio/gemini-image-mix",
    image: pattern3,
    features: [
      "Combine two source design structures",
      "Apply post-rendering studio filters",
      "Explore coordinate variations"
    ],
    accentColor: "#10B981"
  },
  {
    id: "painting-technique",
    title: "Brush Effect & Painting Studio",
    description: "Transform flat vector graphics or images into 8 physical painting mediums: Oil, Liquid Watercolor, Impasto Acrylic, Gouache, Fresco, Encaustic Wax, Charcoal, and Dry Brush.",
    icon: Paintbrush,
    badge: "Neural Medium Synthesis",
    cost: "10 Credits",
    to: "/ai-studio/painting-technique",
    image: pattern5,
    features: [
      "Simulate oil, watercolor, acrylic, gouache, fresco & wax",
      "Interactive before/after split comparison slider",
      "High-resolution PNG export for lookbooks"
    ],
    accentColor: "#E11D2E"
  },
  {
    id: "traditional-art",
    title: "Traditional Art & Indian Craft",
    description: "Convert designs into authentic Indian traditional crafts: Madhubani Folk Art, Warli Tribal Art, Ikat Weaves, Bandhani Tie-Dye, Ajrakh, and Rajasthan Hand Block Prints.",
    icon: Palette,
    badge: "Heritage Craft Synthesis",
    cost: "10 Credits",
    to: "/ai-studio/traditional-art",
    image: pattern6,
    features: [
      "Simulate Madhubani, Warli, Ikat, Bandhani, Ajrakh & Handblock",
      "Interactive before/after split comparison slider",
      "High-resolution PNG export for production briefs"
    ],
    accentColor: "#F59E0B"
  },
  {
    id: "gemini-image-to-image",
    title: "Gemini Image-to-Image",
    description: "Refine a source image with mask guidance, palette controls, and backend-friendly edit parameters for professional image-to-image workflows.",
    icon: Wand2,
    badge: "Reference Editing",
    cost: "12 Credits",
    to: "/ai-studio/gemini-image-to-image",
    image: pattern3,
    features: [
      "Upload a reference image and optional mask",
      "Tune edit mode, palette, and prompt strength",
      "Generate multiple polished variations"
    ],
    accentColor: "#F97316"
  },
  {
    id: "replicate-upscale",
    title: "Replicate Real-ESRGAN Upscale",
    description: "Unblur blurry images and designs using Replicate's Real-ESRGAN super-resolution model. Upscale 2x, 4x, or 8x with extreme line clarity.",
    icon: Maximize,
    badge: "Replicate 4K/8K AI",
    cost: "10 Credits",
    to: "/ai-studio/upscale",
    image: pattern4,
    features: [
      "Select 2x, 4x, or 8x scaling factor",
      "Remove compression blur & artifact noise",
      "Interactive before/after split slider & 4K PNG export"
    ],
    accentColor: "#3B82F6"
  }
];

const chapter3Tools = [
  {
    id: "finder",
    title: "Pattern Extractor",
    description: "Extract clean, printable repeat segments from reference photos, vintage apparel scans, or artwork catalogs. Isolate coordinates and auto-align tile parameters.",
    icon: Search,
    badge: "Repeat Finder",
    cost: "Free",
    to: "/ai-studio/finder",
    image: pattern5,
    features: [
      "Auto-detect repeat bounds from references",
      "Extract repeating elements from draped fabric",
      "Crop and save coordinates to My Designs"
    ],
    accentColor: "#8B5CF6"
  },
  {
    id: "recolor",
    title: "Color Matching & Recolor",
    description: "Swiftly explore secondary color stories. Swop target shade values, hex codes, or match background shades dynamically to coordinates within your active line boards.",
    icon: Palette,
    badge: "Interactive Recolor",
    cost: "5 Credits",
    to: "/ai-studio/recolor",
    image: pattern6,
    features: [
      "Dynamic background tone matching",
      "Hex code values editing",
      "Export multi-color coordinate sheets"
    ],
    accentColor: "#EC4899"
  },
  {
    id: "color-separation",
    title: "Color Separation",
    description: "Extract distinct layers from complex, multi-colored designs. Automatically output isolated screen layers as transparent channels, optimized for screen printing production mills.",
    icon: SwatchBook,
    badge: "Screen Separation",
    cost: "15 Credits",
    to: "/ai-studio/color-separation",
    image: pattern2,
    features: [
      "Separate up to 12 colors into layers",
      "Tweak boundary tolerances dynamically",
      "Download transparent layer files in ZIP format"
    ],
    accentColor: "#06B6D4"
  }
];

export default function Home() {
  const [subscription, setSubscription] = useState<UserSubscriptionSummary>(EMPTY_SUBSCRIPTION_SUMMARY);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!getToken()) return;

      try {
        const summary = await getMySubscription();
        setSubscription(summary);
      } catch (error) {
        console.warn("AI Studio subscription summary unavailable:", error);
        setSubscription(EMPTY_SUBSCRIPTION_SUMMARY);
      }
    };

    void loadSubscription();
  }, []);

  const active = hasActiveSubscription(subscription);
  const remainingDesigns = getRemainingDesigns(subscription);
  const planName = active ? subscription.planName || "Pro" : "Free";
  const creditsLeft = subscription.availableCredits || 0;
  const designsGenerated = subscription.usedDesigns || 0;
  const creditLimit = subscription.creditLimit || creditsLeft;
  const usagePercent = creditLimit > 0 ? Math.min(Math.round((creditsLeft / creditLimit) * 100), 100) : 0;

  return (
    <div className="relative min-h-screen bg-[#111315] font-sans text-white select-none overflow-x-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute left-[-8%] top-[-5%] h-[500px] w-[500px] rounded-full bg-[#BA1B1C]/5 blur-[140px]" />
        <div className="absolute top-[35%] right-[-10%] h-[400px] w-[400px] rounded-full bg-[#153A65]/6 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[-5%] h-[450px] w-[450px] rounded-full bg-[#BA1B1C]/4 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-24 flex flex-col gap-24">
        
        {/* Banner Section */}
        <header className="flex flex-col xl:flex-row items-stretch justify-between gap-10 border-b border-white/5 pb-14">
          <div className="flex-1 max-w-3xl flex flex-col justify-center">
            <span className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-neutral-400 md:text-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#BA1B1C]" />
              AI Studio Workspace
            </span>
            <h1 className="font-serif text-4xl font-light tracking-tight text-white md:text-6xl">
              Generative Textile Architecture
            </h1>
            <p className="mt-6 text-sm font-light leading-7 text-neutral-400 md:text-base">
              Welcome to the professional studio backend. Synthesize patterns, upscale details to raw vector definition, swop seasonal palettes, and extract screen separations directly for fabrication mills.
            </p>
          </div>

          {/* Account Metrics Sidebar Card */}
          <div className="w-full xl:w-[360px] shrink-0 border border-white/10 bg-white/[0.02] rounded-2xl p-6 flex flex-col justify-between shadow-xl backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Workspace Status</p>
                  <h3 className="text-base font-semibold text-white mt-1">Overview Limits</h3>
                </div>
                <span className="rounded-full bg-[#BA1B1C]/10 border border-[#BA1B1C]/35 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ff787a]">
                  {planName} Plan
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-2.5 mt-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Available Credits</span>
                  <span className="text-white font-bold">{creditsLeft} / {creditLimit}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#111315] overflow-hidden border border-white/5">
                  <div 
                    className="h-full rounded-full bg-[#BA1B1C] transition-all duration-500" 
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500 font-bold uppercase tracking-[0.1em] text-[8px]">Total Outputs</span>
                <span className="text-sm font-semibold text-white">{designsGenerated}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500 font-bold uppercase tracking-[0.1em] text-[8px]">Remaining Prints</span>
                <span className="text-sm font-semibold text-white">{remainingDesigns}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Video Tutorial Section */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-stretch gap-10 border-b border-white/5 pb-20">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              <Video className="h-3.5 w-3.5 text-[#BA1B1C]" />
              Tutorial Video
            </span>
            <h2 className="font-serif text-3xl font-light tracking-tight text-white md:text-4xl">
              Master the Creative Workflow
            </h2>
            <p className="mt-4 text-sm font-light leading-7 text-neutral-400">
              Explore how you can leverage prompt coordinates, upscale files for print suitability, adjust patterns with Recolor Studio, and output screen separations.
            </p>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 text-xs text-neutral-300">
                <CheckCircle2 className="h-4 w-4 text-[#BA1B1C] shrink-0 mt-0.5" />
                <span>Format details for perfect seamless boundaries</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-neutral-300">
                <CheckCircle2 className="h-4 w-4 text-[#BA1B1C] shrink-0 mt-0.5" />
                <span>Batch prepare high-resolution textures for mills</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-neutral-300">
                <CheckCircle2 className="h-4 w-4 text-[#BA1B1C] shrink-0 mt-0.5" />
                <span>Isolate color channels with Color Separation tools</span>
              </div>
            </div>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video lg:aspect-auto min-h-[220px] lg:min-h-[300px] shadow-2xl">
            <iframe 
              src="https://www.youtube.com/embed/ORjlEpjiHrU" 
              title="RDC AI Studio Video Tutorial"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </section>

        {/* CHAPTER 1: DESIGN INITIALIZATION */}
        <section className="flex flex-col gap-12">
          <div className="border-b border-white/5 pb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Chapter I</p>
            <h2 className="font-serif text-3xl font-light text-white mt-2 md:text-4xl">Pattern Synthesis & Ideation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {chapter1Tools.map((tool) => (
              <article
                key={tool.id}
                className="group rounded-2xl border border-white/5 bg-white/[0.01] p-6 shadow-lg flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.03]"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]" style={{ color: tool.accentColor }}>
                      <Wand2 className="h-5 w-5" />
                    </span>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">{tool.badge}</span>
                      <span className="rounded-full bg-[#BA1B1C]/10 border border-[#BA1B1C]/20 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-[#ff787a] font-semibold">{tool.cost}</span>
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl font-light text-white">{tool.title}</h3>
                  <p className="mt-3 text-sm font-light leading-6 text-neutral-400">{tool.description}</p>
                  
                  <div className="mt-6 space-y-2">
                    {tool.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5 text-xs text-neutral-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#BA1B1C] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5">
                  <Link
                    to={tool.to}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-white px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A] transition-transform hover:scale-[1.02]"
                  >
                    Open Tool
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* IN-BETWEEN INFORMATION SECTION 1 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-8 border-y border-white/5">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video shadow-2xl">
            <img src={flamingoShowcase} alt="AI Design Synthesis" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">Editorial Insight</span>
            <h3 className="font-serif text-2xl font-light text-white md:text-3xl">Bridging Hand-Craft & AI Synthesis</h3>
            <p className="mt-4 text-sm font-light leading-7 text-neutral-400">
              Professional textile design demands high-fidelity coordinates that respect organic, fluid drawing styles. Our generator structures pixel values utilizing customized LORA coordinate tables to balance the raw warmth of watercolor textures, block print stamps, and delicate linework overlays.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-300">
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">Organic repeat flow</span>
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">Custom fabric parameters</span>
            </div>
          </div>
        </section>

        {/* CHAPTER 2: REFINEMENT & SCALE */}
        <section className="flex flex-col gap-12">
          <div className="border-b border-white/5 pb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Chapter II</p>
            <h2 className="font-serif text-3xl font-light text-white mt-2 md:text-4xl">Refinement & High-Resolution Scaling</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {chapter2Tools.map((tool) => (
              <article
                key={tool.id}
                className="group rounded-2xl border border-white/5 bg-white/[0.01] p-6 shadow-lg flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.03]"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]" style={{ color: tool.accentColor }}>
                      <Maximize className="h-5 w-5" />
                    </span>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">{tool.badge}</span>
                      <span className="rounded-full bg-[#BA1B1C]/10 border border-[#BA1B1C]/20 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-[#ff787a] font-semibold">{tool.cost}</span>
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl font-light text-white">{tool.title}</h3>
                  <p className="mt-3 text-sm font-light leading-6 text-neutral-400">{tool.description}</p>
                  
                  <div className="mt-6 space-y-2">
                    {tool.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5 text-xs text-neutral-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#BA1B1C] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5">
                  <Link
                    to={tool.to}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-white px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A] transition-transform hover:scale-[1.02]"
                  >
                    Open Tool
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* IN-BETWEEN INFORMATION SECTION 2 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-8 border-y border-white/5">
          <div className="flex flex-col justify-center order-2 lg:order-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">Production Standard</span>
            <h3 className="font-serif text-2xl font-light text-white md:text-3xl">Mill-Ready Scale & Layout Formats</h3>
            <p className="mt-4 text-sm font-light leading-7 text-neutral-400">
              Low-resolution visuals can compromise physical fabric prints by causing blurred coordinates or color bleeding. RDC's upscaling network sharpens borders and balances fiber textures, ensuring pattern assets are converted to high-definition files suitable for wide-format rotary printers.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-300">
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">High-res rotary output</span>
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">Lossless zip archives</span>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video shadow-2xl order-1 lg:order-2">
            <img src={colorfulCharacterShowcase} alt="Mill production scaling" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>
        </section>

        {/* CHAPTER 3: ISOLATION & SEPARATION */}
        <section className="flex flex-col gap-12">
          <div className="border-b border-white/5 pb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Chapter III</p>
            <h2 className="font-serif text-3xl font-light text-white mt-2 md:text-4xl">Extraction & Color Separation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {chapter3Tools.map((tool) => (
              <article
                key={tool.id}
                className="group rounded-2xl border border-white/5 bg-white/[0.01] p-6 shadow-lg flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.03]"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]" style={{ color: tool.accentColor }}>
                      <Search className="h-5 w-5" />
                    </span>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">{tool.badge}</span>
                      <span className="rounded-full bg-[#BA1B1C]/10 border border-[#BA1B1C]/20 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-[#ff787a] font-semibold">{tool.cost}</span>
                    </div>
                  </div>
                  <h3 className="font-serif text-xl font-light text-white">{tool.title}</h3>
                  <p className="mt-3 text-xs font-light leading-5 text-neutral-400">{tool.description}</p>
                  
                  <div className="mt-6 space-y-2">
                    {tool.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5 text-[11px] text-neutral-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#BA1B1C] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5">
                  <Link
                    to={tool.to}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-white px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A] transition-transform hover:scale-[1.02] w-full"
                  >
                    Open Tool
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Collapsible FAQ Section */}
        <section className="flex flex-col gap-12 border-t border-white/5 pt-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              <HelpCircle className="h-3.5 w-3.5 text-[#BA1B1C]" />
              FAQ Directory
            </span>
            <h2 className="font-serif text-3xl font-light text-white tracking-tight md:text-4xl">Studio FAQs</h2>
            <p className="mt-3 text-sm font-light text-neutral-400">
              Common workspace questions about credits, usage licenses, and print separation standards.
            </p>
          </div>

          <div className="max-w-3xl mx-auto w-full space-y-4">
            {[
              {
                question: "How do AI generation credits work in the studio?",
                answer: "Every action in RDC AI Studio has a fixed credit cost, transparently shown on the module cards. Credits are automatically deducted from your workspace status when you trigger generating patterns, scaling images, or executing screen separations."
              },
              {
                question: "Can I use generated patterns for commercial fabric printing?",
                answer: "Yes, you hold full commercial usage rights for all design outcomes created in RDC AI Studio. You can print, modify, duplicate, and manufacture them without royalty constraints."
              },
              {
                question: "How do I download layered screen separations?",
                answer: "Using our Color Separation tool, you can isolate up to 12 colors dynamically. Once separated, the tool packages each screen channel as a transparent PNG mask and bundles them into a single, downloadable ZIP folder ready for printing screens."
              },
              {
                question: "Are my custom prompt coordinates and uploads kept private?",
                answer: "Yes, all source sketch uploads, color separations, and prompt outcomes generated in RDC AI Studio are private to your specific workspace. They are saved securely under your profile and will not be shared with other clients."
              },
              {
                question: "What resolution are the upscaled patterns?",
                answer: "Our Smart Upscale module scales patterns up to 4K resolution (4096 x 4096 px) using textile-optimized filters, making them fully suitable for rotary wide-format fabric printing screens without pixelation."
              }
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden transition-colors hover:border-white/10"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left font-serif text-lg font-light text-white focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="border-t border-white/5 p-5 text-xs leading-6 text-neutral-400 font-light bg-white/[0.005]">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Finisher Section */}
        <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#181B1F] via-[#121417] to-[#111315] p-8 md:p-12 text-center shadow-2xl flex flex-col items-center gap-6">
          <div className="absolute right-0 bottom-0 h-full w-full bg-[radial-gradient(circle_at_bottom_right,rgba(186,27,28,0.08),transparent_70%)] pointer-events-none" />
          <h2 className="font-serif text-3xl font-light text-white tracking-tight md:text-4xl max-w-xl leading-snug">
            Ready to optimize your design pipeline?
          </h2>
          <p className="text-sm font-light text-neutral-400 max-w-md leading-relaxed">
            Upgrade your plan to unlock 4K exports, priority GPU processing pipelines, and unlimited screen layer separations.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <Link
              to="/ai-studio/generate"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-white px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A] transition-transform hover:-translate-y-0.5"
            >
              Start Creating
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/subscription"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5 hover:bg-white/[0.06]"
            >
              View Pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
