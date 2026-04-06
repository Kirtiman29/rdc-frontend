import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const segments = [
  {
    title: "Womens",
    subtitle: "Elegant & contemporary prints",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=80",
    href: "/gallery?segment=womens",
    size: "big"
  },
  {
    title: "Mens",
    subtitle: "Bold & structured patterns",
    image: "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=1200&auto=format&fit=crop&q=80",
    href: "/gallery?segment=mens",
    size: "small"
  },
  {
    title: "Kids",
    subtitle: "Playful & vibrant designs",
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&auto=format&fit=crop&q=80",
    href: "/gallery?segment=kids",
    size: "small"
  },
  {
    title: "Home",
    subtitle: "Timeless interior textures",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=80",
    href: "/gallery?segment=home",
    size: "big"
  }
];

const ShopBySegment = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* EDITORIAL HEADER */}
        <div className="max-w-2xl mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1A1A1A]/40 block mb-4">
            Categories
          </span>
          <h2 className="font-serif text-5xl md:text-6xl text-[#1A1A1A] mb-6">
            Shop by Segment
          </h2>
          <p className="text-neutral-500 text-base md:text-lg font-light leading-relaxed italic">
            Explore designs meticulously tailored for high fashion, bespoke lifestyle, and signature interiors.
          </p>
        </div>

        {/* ASYMMETRIC CAMPAIGN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[450px] md:auto-rows-[550px] gap-6">
          {segments.map((segment, index) => (
            <Link
              key={segment.title}
              to={segment.href}
              className={cn(
                "group relative overflow-hidden bg-neutral-100 transition-all duration-700",
                segment.size === "big" ? "md:col-span-4" : "md:col-span-2"
              )}
            >
              {/* IMAGE WITH ZOOM EFFECT */}
              <img
                src={segment.image}
                alt={segment.title}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
              />

              {/* CINEMATIC GRADIENT OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

              {/* BOTTOM-LEFT CONTENT */}
              <div className="absolute bottom-10 left-10 right-10 z-20 transform transition-transform duration-500 group-hover:-translate-y-2">
                <h3 className="font-serif text-4xl md:text-5xl text-white mb-2 tracking-tight">
                  {segment.title}
                </h3>
                <p className="text-white/70 text-sm md:text-base font-light mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                  {segment.subtitle}
                </p>
                
                {/* MICRO CTA */}
                <div className="flex items-center gap-3 text-white text-[10px] font-bold uppercase tracking-[0.4em]">
                  <span className="border-b border-white/40 pb-1 group-hover:border-white transition-colors">
                    Explore
                  </span>
                  <ArrowRight className="w-3 h-3 transition-transform duration-500 group-hover:translate-x-2" />
                </div>
              </div>

              {/* TOP ACCENT (Optional) */}
              <div className="absolute top-8 right-8 border border-white/20 px-3 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-[8px] text-white uppercase tracking-widest">Featured</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopBySegment;