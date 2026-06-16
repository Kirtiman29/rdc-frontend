import { useEffect, useMemo, useState } from "react";
import { Sparkles, ArrowRight, Zap, Play, History, Star, ShieldCheck, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { DesignCard } from "@/ai/components/generate/DesignCard";
import { getToken } from "@/api/apiClient";
import {
  EMPTY_SUBSCRIPTION_SUMMARY,
  getMySubscription,
  getRemainingDesigns,
  hasActiveSubscription,
  type UserSubscriptionSummary,
} from "@/api/subscriptionApi";

// Asset Imports
import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";
import pattern5 from "@/assets/sample-pattern-5.jpg";
import pattern6 from "@/assets/sample-pattern-6.jpg";

const recentDesigns = [
  { image: pattern1, title: "Mughal Crimson" },
  { image: pattern2, title: "Indigo Paisley" },
  { image: pattern3, title: "Desert Weave" },
  { image: pattern4, title: "Silk Blossom" },
  { image: pattern5, title: "Batik Storm" },
  { image: pattern6, title: "Ikat Flow" },
];

const suggestedPrompts = [
  { category: "FLORAL", color: "text-red-500", prompt: "Intricate Mughal-inspired floral motif with gold thread on deep crimson silk" },
  { category: "PAISLEY", color: "text-blue-400", prompt: "Traditional Paisley with ikat technique, indigo and terracotta colorway" },
  { category: "GEOMETRIC", color: "text-emerald-400", prompt: "Modern Bauhaus-inspired geometric repeat, bold primary colors, sharp lines" },
  { category: "ETHNIC", color: "text-violet-400", prompt: "Tribal ethnic weave with chevron motifs, warm earth tones, handwoven feel" },
];

export default function Home() {
  const [subscription, setSubscription] = useState<UserSubscriptionSummary>(EMPTY_SUBSCRIPTION_SUMMARY);

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

  const stats = useMemo(() => {
    const active = hasActiveSubscription(subscription);
    const remainingDesigns = getRemainingDesigns(subscription);

    return [
      { value: String(remainingDesigns), label: "DESIGN USES LEFT", icon: History },
      { value: String(subscription.availableCredits || 0), label: "AI CREDITS", icon: KeyRound },
      { value: active ? subscription.planName || "ACTIVE" : "NONE", label: "PLAN STATUS", icon: ShieldCheck },
      { value: subscription.planType || "LOCKED", label: "ACCESS TYPE", icon: Zap },
    ];
  }, [subscription]);

  return (
    <div className="min-h-screen overflow-y-auto bg-[#050505] custom-scrollbar">
      <div className="mx-auto max-w-[1400px] p-6 lg:p-10 space-y-12">
        
        {/* --- HERO SECTION --- */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff1a1a]/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 grid gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#ff1a1a] mb-6">
                <Sparkles className="w-3 h-3" /> Textile Engine v1.0
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white leading-[0.92] sm:text-6xl lg:text-7xl xl:text-[5.5rem] mb-6">
                DESIGN THE <br />
                <span className="text-[#ff1a1a]">FUTURE</span> OF SURFACE PATTERN
                <span className="block">POWERED BY AI</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-gray-400 mb-8">
                Every great collection starts with a pattern no one has made yet. Textile gives designers, brands, and makers the power to generate original, culturally rich, studio-ready fabric designs at the speed of imagination.
              </p>

              {!hasActiveSubscription(subscription) && (
                <div className="mb-6 rounded-3xl border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 px-5 py-4 text-sm text-[#ff8a8a]">
                  Choose a plan to unlock AI generation credits and premium design usage.
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link
                  to="/ai-studio/generate"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff1a1a] px-8 py-4 text-sm font-bold text-white shadow-[0_18px_90px_rgba(255,26,26,0.18)] transition hover:bg-red-700"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Creating
                </Link>
                <Link
                  to="/ai-studio/gallery"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  View Gallery
                </Link>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4 self-start">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
                <img src={pattern1} alt="Mughal Crimson pattern preview" className="h-full w-full object-cover" />
              </div>
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
                <img src={pattern3} alt="Desert Weave pattern preview" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* --- STATISTICS GRID --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col justify-between gap-4 rounded-3xl border border-white/5 bg-[#0a0a0a] p-6 transition hover:border-white/10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/5 text-[#ff1a1a] shadow-inner">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* --- RECENT PROJECTS --- */}
        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">RECENT GENERATIONS</h2>
              <p className="mt-2 text-sm text-gray-500">Pick up where you left off</p>
            </div>
            <Link to="/ai-studio/gallery" className="inline-flex items-center gap-1 text-xs font-bold text-[#ff1a1a] hover:underline">
              ALL PROJECTS <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {recentDesigns.map((d, i) => (
              <DesignCard key={i} image={d.image} title={d.title} />
            ))}
          </div>
        </section>

        {/* --- INSPIRATION BOX --- */}
        <section className="rounded-[2rem] border border-white/5 bg-gradient-to-r from-[#0a0a0a] to-transparent p-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
             <Zap className="h-4 w-4 text-[#ff1a1a]" /> PROMPT INSPIRATION
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestedPrompts.map((p, i) => (
              <Link
                key={i}
                to="/ai-studio/generate"
                className="group rounded-3xl border border-white/5 bg-white/5 p-5 transition hover:border-[#ff1a1a]/30 hover:bg-white/10"
              >
                <span className={`block text-[10px] font-black uppercase tracking-[0.35em] ${p.color} mb-2`}>
                  {p.category}
                </span>
                <p className="text-sm leading-7 text-gray-400 transition group-hover:text-white">
                  "{p.prompt}"
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
