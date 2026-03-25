// src/ai/pages/MyDesigns.tsx
import { Search } from "lucide-react";
import { DesignCard } from "@/ai/components/generate/DesignCard";

const designs = [
  { image: "/src/assets/sample-pattern-1.jpg", title: "Floral Dark" },
  { image: "/src/assets/sample-pattern-2.jpg", title: "Gold Lattice" },
  { image: "/src/assets/sample-pattern-3.jpg", title: "Red Paisley" },
  { image: "/src/assets/sample-pattern-4.jpg", title: "Abstract Brush" },
  { image: "/src/assets/sample-pattern-5.jpg", title: "Ethnic Stripe" },
  { image: "/src/assets/sample-pattern-6.jpg", title: "Rose Garden" },
];

export default function MyDesigns() {
  return (
    <div className="p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Designs</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search designs..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff1a1a]"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["All", "Floral", "Geometric", "Paisley", "Ethnic", "Abstract"].map((f, i) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              i === 0
                ? "bg-[#ff1a1a]/10 text-[#ff1a1a]"
                : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {designs.map((d, i) => (
          <DesignCard key={i} image={d.image} title={d.title} />
        ))}
      </div>
    </div>
  );
}
