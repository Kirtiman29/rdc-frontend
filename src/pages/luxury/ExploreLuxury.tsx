import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Star, ShieldCheck, Gem, Globe, ArrowRight } from "lucide-react";
import luxuryBanner from "@/assets/luxury-banner.png";

// Updated Sample Images for Luxury Context
// const luxuryBanner = "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=2000";
const luxuryPattern1 = "https://images.unsplash.com/photo-1584184854125-51633002e3b6?auto=format&fit=crop&q=80&w=800";
const luxuryPattern2 = "https://images.unsplash.com/photo-1615529328322-924d405330ec?auto=format&fit=crop&q=80&w=800";
const luxuryPattern3 = "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?auto=format&fit=crop&q=80&w=800";
const luxuryPattern4 = "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&q=80&w=800";
const luxuryPattern5 = "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&q=80&w=800";
const luxuryPattern6 = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800";

const ExploreLuxury = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      <Header />

      <main className="flex-1">
        {/* --- HERO SECTION: LUXURY EDIT --- */}
        <section className="relative h-[75vh] md:h-[85vh] overflow-hidden">
          <img
            src={luxuryBanner}
            alt="Luxury Textile Banner"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
            <div className="container mx-auto px-4 md:px-8">
              <div className="max-w-3xl">
                <span className="text-[#C5A059] uppercase tracking-[0.3em] text-sm font-bold mb-4 block">
                  The Signature Collection
                </span>
                <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight">
                  Elevated <br /> <span className="italic font-light">Textile Artistry</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg md:text-xl text-neutral-300 font-light leading-relaxed">
                  Discover a curated world of premium silks, heavy brocades, and 
                  hand-painted patterns designed for the most discerning interiors 
                  and high-fashion silhouettes.
                </p>

                <div className="mt-10 flex flex-wrap gap-5">
                  <Link
                    to="/luxury/shop"
                    className="px-10 py-4 bg-[#C5A059] text-white rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#A6864A] transition-all"
                  >
                    SHOP THE COLLECTION
                  </Link>
                  <Link
                    to="/luxury/curated-sets"
                    className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                  >
                    View Lookbook
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- LUXURY PILLARS --- */}
        <section className="py-20 bg-white border-b border-neutral-100">
          <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="flex flex-col items-center text-center">
              <Gem className="w-10 h-10 text-[#C5A059] mb-6 font-light" />
              <h3 className="text-xl font-serif text-[#1A1A1A] mb-3">Only the Finest Fibers</h3>
              <p className="text-neutral-500 font-light leading-relaxed">
                From Grade-A mulberry silk to sustainable Belgian linen—we never cut corners on the foundation. Because great fabric starts with great raw material.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="w-10 h-10 text-[#C5A059] mb-6" />
              <h3 className="text-xl font-serif text-[#1A1A1A] mb-3">Made Once. Worn Forever</h3>
              <p className="text-neutral-500 font-light leading-relaxed">
                Every design is digitally mastered for pixel-perfect clarity and color that stays vivid wash after wash, year after year.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <Globe className="w-10 h-10 text-[#C5A059] mb-6" />
              <h3 className="text-xl font-serif text-[#1A1A1A] mb-3">Patterns Nobody Else Has</h3>
              <p className="text-neutral-500 font-light leading-relaxed">
                We work with world-renowned textile artists to bring you exclusive designs you simply cannot find anywhere else. Rare by design
              </p>
            </div>
          </div>
        </section>

        {/* --- SHOP BY PRESTIGE COLLECTION --- */}
        <section className="py-24 bg-[#FAF9F6]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col items-center mb-16">
              <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">
                Prestige Collections
              </h2>
              <div className="w-20 h-[1px] bg-[#C5A059]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                { name: "The Gilded Age", img: luxuryPattern1, cat: "Metallic Brocades" },
                { name: "Veridian Flora", img: luxuryPattern2, cat: "Velvet Prints" },
                { name: "Art Deco Noir", img: luxuryPattern3, cat: "Satin Finish" },
                { name: "Heritage Linens", img: luxuryPattern4, cat: "Embroidery Look" },
                { name: "Celestial Silk", img: luxuryPattern5, cat: "Natural Silk" },
                { name: "Baroque Revival", img: luxuryPattern6, cat: "Heavy Canvas" },
              ].map((item, index) => (
                <Link key={index} to="#" className="group relative overflow-hidden bg-white">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <p className="text-[10px] uppercase tracking-[0.2em] mb-2 opacity-80">{item.cat}</p>
                    <h4 className="text-2xl font-serif mb-4">{item.name}</h4>
                    <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore Collection <ArrowRight className="ml-2 w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* --- THE LUXURY EXPERIENCE SECTION --- */}
        <section className="py-24 bg-[#1A1A1A] text-white overflow-hidden">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl mb-8 leading-tight">
                  Your Vision Deserves <br /> the Right Foundation
                </h2>
                <p className="text-neutral-400 text-lg font-light mb-10 leading-relaxed">
                  Great design doesn't happen by accident — it starts with materials that match your standard. Join the RDC Trade Program and get access to the tools professionals actually need: high-resolution TIFF files, personalized color matching, and bulk pricing built around how you work, not how a catalog does.
                </p>
                <button className="flex items-center gap-4 text-[#C5A059] font-bold uppercase tracking-widest text-sm group">
                  See What Trade Members Get → <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 border border-[#C5A059]/30 -z-0"></div>
                <img 
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=1000" 
                  alt="Textile detail" 
                  className="relative z-10 w-full grayscale-[0.5] hover:grayscale-0 transition-all duration-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- RECENT CUSTOMER CREATIONS --- */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="font-serif text-3xl text-center mb-16 text-[#1A1A1A]">Most Coveted Designs</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Midnight Damask", price: "$84.00/yd", img: luxuryPattern1 },
                { title: "Gold-Leaf Botanical", price: "$112.00/yd", img: luxuryPattern2 },
                { title: "Imperial Geometric", price: "$96.00/yd", img: luxuryPattern3 },
                { title: "Venetian Velvet", price: "$125.00/yd", img: luxuryPattern4 },
              ].map((fav, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-square overflow-hidden mb-4 bg-[#F2F2F2]">
                    <img
                      src={fav.img}
                      alt={fav.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h5 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">{fav.title}</h5>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-neutral-500 italic">Premium Silk Blend</p>
                    <p className="text-sm font-serif text-[#C5A059]">{fav.price}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#C5A059] mt-3">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    <span className="text-[10px] text-neutral-400 ml-2 uppercase tracking-widest">Verified Luxury</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ExploreLuxury;