import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { ShieldCheck, Gem, Globe, ArrowRight, Loader2 } from "lucide-react";
import { getCategories, getDesigns } from "@/api/designApi";
import { getAssetUrl } from "@/api/apiClient";
import luxuryBanner from "@/assets/luxury-banner.png";
import type { Category, Design } from "@/types/product";
import { formatPrice } from "@/utils/price";
import { getEntityPath } from "@/utils/routes";

const luxurySegments = [
  {
    title: "Women's",
    subtitle: "Elegant luxury florals and couture-ready surfaces",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=80",
    href: "/luxury/shop?segment=WOMENSWEAR&luxury=true",
    tag: "Womenswear",
  },
  {
    title: "Men's",
    subtitle: "Structured textures and sharp statement repeats",
    image: "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=1200&auto=format&fit=crop&q=80",
    href: "/luxury/shop?segment=MENSWEAR&luxury=true",
    tag: "Menswear",
  },
  {
    title: "Kids",
    subtitle: "Refined playful motifs with a premium finish",
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&auto=format&fit=crop&q=80",
    href: "/luxury/shop?segment=KIDSWEAR&luxury=true",
    tag: "Kidswear",
  },
  {
    title: "Home / Accessories",
    subtitle: "Interior stories and decorative accents with depth",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=80",
    href: "/luxury/shop?segment=HOME_INTERIOR&luxury=true",
    tag: "Home Interior",
  },
];

const resolveCategoryImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl || imageUrl === "null") {
    return "https://placehold.co/800x1000?text=Luxury+Category";
  }

  try {
    const assetBase = import.meta.env.VITE_ASSET_SERVICE_URL;

    if (imageUrl.includes("/api/assets/")) {
      const parts = imageUrl.split("/");
      const uuid = imageUrl.includes("/download")
        ? parts[parts.indexOf("assets") + 1]
        : parts[parts.length - 1];

      return `${assetBase}/api/assets/download/${uuid}`;
    }

    if (!imageUrl.startsWith("http")) {
      return `${assetBase}/api/assets/download/${imageUrl}`;
    }

    return imageUrl;
  } catch (error) {
    console.error("Luxury category image resolution error:", error);
    return "https://placehold.co/800x1000?text=Luxury+Category";
  }
};

const ExploreLuxury = () => {
  const [recentLuxuryDesigns, setRecentLuxuryDesigns] = useState<Design[]>([]);
  const [recentLuxuryLoading, setRecentLuxuryLoading] = useState(true);
  const [luxuryCategories, setLuxuryCategories] = useState<Category[]>([]);
  const [luxuryCategoriesLoading, setLuxuryCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchRecentLuxuryDesigns = async () => {
      try {
        const response: any = await getDesigns({
          luxury: true,
          sortBy: "createdAt,desc",
          size: 8,
        });
        const items = response?.content || (Array.isArray(response) ? response : []);
        const latestLuxury = [...items]
          .filter((item: Design) => item.luxury === true)
          .sort(
            (a: Design, b: Design) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 4);

        setRecentLuxuryDesigns(latestLuxury);
      } catch (error) {
        console.error("Failed to sync recent luxury designs:", error);
      } finally {
        setRecentLuxuryLoading(false);
      }
    };

    fetchRecentLuxuryDesigns();
  }, []);

  useEffect(() => {
    const fetchLuxuryCategories = async () => {
      try {
        const [categories, luxuryResponse] = await Promise.all([
          getCategories(),
          getDesigns({
            luxury: true,
            sortBy: "createdAt,desc",
            size: 40,
          }),
        ]);

        const categoryList = Array.isArray(categories) ? categories : [];
        const luxuryItems = luxuryResponse?.content || (Array.isArray(luxuryResponse) ? luxuryResponse : []);

        const orderedCategoryIds = [
          ...new Set(
            luxuryItems.flatMap((item: Design) => {
              const linkedCategories = item.categories?.map((category) => category.id) || [];
              const fallbackCategory = item.category?.id ? [item.category.id] : [];
              return [...linkedCategories, ...fallbackCategory];
            })
          ),
        ];

        const filteredCategories = orderedCategoryIds
          .map((categoryId) => categoryList.find((category) => category.id === categoryId))
          .filter((category): category is Category => Boolean(category))
          .slice(0, 4);

        setLuxuryCategories(filteredCategories);
      } catch (error) {
        console.error("Failed to sync luxury categories:", error);
      } finally {
        setLuxuryCategoriesLoading(false);
      }
    };

    fetchLuxuryCategories();
  }, []);

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

        {/* --- SHOP BY SEGMENT --- */}
        <section className="py-24 bg-[#FAF9F6]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col items-center mb-16">
              <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">
                Shop by Segment
              </h2>
              <div className="w-20 h-[1px] bg-[#C5A059]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {luxurySegments.map((segment) => (
                <Link key={segment.title} to={segment.href} className="group relative overflow-hidden bg-white shadow-[0_18px_50px_rgba(26,26,26,0.08)]">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={segment.image}
                      alt={segment.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/90 via-[#1A1A1A]/20 to-transparent group-hover:from-[#1A1A1A]/95 transition-all duration-300"></div>
                  <div className="absolute left-6 top-6 border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-sm">
                    {segment.tag}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-7 text-white md:p-8">
                    <h4 className="text-2xl font-serif mb-3">{segment.title}</h4>
                    <p className="mb-5 text-sm font-light leading-relaxed text-white/72">
                      {segment.subtitle}
                    </p>
                    <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-[0.22em]">
                      Explore Segment <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <span className="mb-4 block text-xs font-bold uppercase tracking-[0.3em] text-[#C5A059]">
                Curated Luxury Lines
              </span>
              <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">
                Shop by Category
              </h2>
              <p className="max-w-2xl text-sm md:text-base font-light leading-relaxed text-neutral-500">
                Browse luxury-only categories shaped by the newest premium designs in the collection.
              </p>
            </div>

            {luxuryCategoriesLoading ? (
              <div className="flex h-56 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#C5A059]" />
              </div>
            ) : luxuryCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {luxuryCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/luxury/shop?categoryId=${category.id}&luxury=true`}
                    className="group relative overflow-hidden bg-[#F4F0E8] shadow-[0_18px_50px_rgba(26,26,26,0.08)]"
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      <img
                        src={resolveCategoryImageUrl(category.imageUrl)}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/800x1000?text=Luxury+Category";
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/85 via-[#1A1A1A]/18 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-7 text-white md:p-8">
                      <h3 className="mb-3 font-serif text-2xl">{category.name}</h3>
                      <p className="mb-5 text-sm font-light leading-relaxed text-white/72">
                        Luxury designs curated under the {category.name} category.
                      </p>
                      <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-[0.22em]">
                        Explore Category
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm uppercase tracking-[0.2em] text-neutral-500">
                No luxury categories available right now.
              </p>
            )}
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
                  src="https://images.unsplash.com/photo-1770732940492-ec02987b3d4c?auto=format&fit=crop&q=80&w=1400" 
                  alt="Luxury textile paisley pattern" 
                  className="relative z-10 w-full grayscale-[0.5] hover:grayscale-0 transition-all duration-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- RECENT CUSTOMER CREATIONS --- */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="font-serif text-3xl text-center mb-16 text-[#1A1A1A]">Recent Luxury Designs</h2>

            {recentLuxuryLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#C5A059]" />
              </div>
            ) : recentLuxuryDesigns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {recentLuxuryDesigns.map((design) => (
                  <Link
                    key={design.id}
                    to={getEntityPath("/luxury/design", design)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-square overflow-hidden mb-4 bg-[#F2F2F2]">
                      <img
                        src={getAssetUrl(
                          design.media?.find((media) => media.role === "COVER")?.url || design.assetUuid
                        )}
                        alt={design.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-4 top-4 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]">
                        Recent
                      </div>
                    </div>
                    <h5 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
                      {design.title}
                    </h5>
                    <div className="flex justify-between items-center mt-2 gap-3">
                      <p className="text-xs text-neutral-500 italic">Luxury Flagged Design</p>
                      <p className="text-sm font-serif text-[#C5A059]">
                        {formatPrice(design.finalPriceCents || design.basePriceCents)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm uppercase tracking-[0.2em] text-neutral-500">
                No recent luxury designs available right now.
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ExploreLuxury;
