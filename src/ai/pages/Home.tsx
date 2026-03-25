import { Sparkles, ArrowRight, Zap, Play, History, Star, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { DesignCard } from "@/ai/components/generate/DesignCard";

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

const stats = [
  { value: "128", label: "DESIGNS CREATED", icon: History },
  { value: "24", label: "FAVORITES", icon: Star },
  { value: "PRO", label: "PLAN STATUS", icon: ShieldCheck },
  { value: "99.8%", label: "SYSTEM UPTIME", icon: Zap },
];

export default function Home() {
  return (
    <div className="h-full overflow-y-auto bg-[#050505] custom-scrollbar">
      <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-12">
        
        {/* --- HERO SECTION --- */}
        <section className="relative rounded-[2.5rem] overflow-hidden bg-[#0a0a0a] border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff1a1a]/10 via-transparent to-transparent opacity-50" />
          
          <div className="relative p-8 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/20 text-[#ff1a1a] text-[10px] font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3" /> Textile Engine v1.0
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85] mb-6">
                DESIGN THE <br />
                <span className="text-[#ff1a1a]">FUTURE</span> OF WEAVE
              </h1>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-md">
                Create seamless, high-fidelity textile patterns using specialized 
                generative AI trained on global heritage fabrics.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/ai-studio/generate"
                  className="px-8 py-4 rounded-2xl bg-[#ff1a1a] text-white font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(255,26,26,0.2)]"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Workspace
                </Link>
                <Link
                  to="/ai-studio/gallery"
                  className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                >
                  View Gallery
                </Link>
              </div>
            </div>

            {/* Hero Image Mosaic */}
            <div className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-sm rotate-3">
                <img src={pattern1} className="rounded-2xl border border-white/10 shadow-2xl" alt="pattern" />
                <img src={pattern3} className="rounded-2xl border border-white/10 shadow-2xl mt-8" alt="pattern" />
            </div>
          </div>
        </section>

        {/* --- STATISTICS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 mb-4">
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* --- RECENT PROJECTS --- */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">RECENT GENERATIONS</h2>
              <p className="text-sm text-gray-500">Pick up where you left off</p>
            </div>
            <Link to="/ai-studio/gallery" className="text-xs font-bold text-[#ff1a1a] flex items-center gap-1 hover:underline">
              ALL PROJECTS <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentDesigns.map((d, i) => (
              <DesignCard key={i} image={d.image} title={d.title} />
            ))}
          </div>
        </section>

        {/* --- INSPIRATION BOX --- */}
        <section className="p-8 rounded-[2rem] bg-gradient-to-r from-[#0a0a0a] to-transparent border border-white/5">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <Zap className="w-4 h-4 text-[#ff1a1a]" /> PROMPT INSPIRATION
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedPrompts.map((p, i) => (
              <Link
                key={i}
                to="/ai-studio/generate"
                className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#ff1a1a]/30 transition-all group"
              >
                <span className={`text-[10px] font-black tracking-widest mb-2 block ${p.color}`}>
                  {p.category}
                </span>
                <p className="text-sm text-gray-400 group-hover:text-white transition-colors leading-relaxed">
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