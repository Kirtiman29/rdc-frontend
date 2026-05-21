import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import fabricsBanner from "@/assets/fabrics-banner.jpg";
import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";
import pattern5 from "@/assets/sample-pattern-5.jpg";
import pattern6 from "@/assets/sample-pattern-6.jpg";
import { getAssetUrl } from "@/api/apiClient";
import { getFabricCategories, getFabrics } from "@/api/fabricApi";
import { formatPrice } from "@/utils/price";
import type { Category, Design } from "@/types/product";
import { getFabricPath } from "@/utils/routes";
import { getFabricPriceEntries } from "@/utils/fabrics";

const fallbackCollections = [
  { image: pattern1, title: "Field & Feather" },
  { image: pattern2, title: "Coquette Spring Dreams" },
  { image: pattern3, title: "Coastal Boho" },
  { image: pattern4, title: "Spring & Easter" },
  { image: pattern5, title: "Cottage Daydream" },
  { image: pattern6, title: "Minimalist Vibes" },
];

const getFabricImage = (fabric: Design) => {
  const cover = fabric.media?.find((item) => item.role === "COVER");
  return getAssetUrl(cover?.url || fabric.assetUuid);
};

const getCategoryImage = (category: Category, fallbackImage: string) => {
  return category.imageUrl ? getAssetUrl(category.imageUrl) : fallbackImage;
};

const getFabricMeta = (fabric: Design) => {
  const parts = [
    fabric.material || fabric.imageType,
    fabric.gsm ? `${fabric.gsm} GSM` : undefined,
    fabric.width ? `${fabric.width} in` : undefined,
  ].filter(Boolean);

  return parts.join(" - ");
};

const ExploreFabrics = () => {
  const [fabrics, setFabrics] = useState<Design[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [fabricsResponse, categoriesResponse] = await Promise.all([
          getFabrics(),
          getFabricCategories(),
        ]);

        if (!isMounted) {
          return;
        }

        setFabrics(fabricsResponse.content.filter((fabric) => fabric.active));
        setCategories(categoriesResponse);
      } catch (error) {
        console.error("Failed to load public fabrics:", error);
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const collectionCategories = categories.slice(0, 6);
  const favoriteFabrics = [...fabrics]
    .sort((a, b) => Number(b.specialOffer) - Number(a.specialOffer))
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F0]">
      <Header />

      <main className="flex-1">
        <section className="relative h-[60vh] md:h-[70vh]">
          <img
            src={fabricsBanner}
            alt="Textile Treasures Banner"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 flex items-center bg-black/40">
            <div className="container mx-auto px-4 text-center text-white md:px-8">
              <h1 className="font-serif text-5xl font-medium tracking-tight md:text-6xl">
                FABRIC THAT FITS EXACTLY WHAT YOU NEED
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl font-medium text-neutral-100">
                Thousands of original artist prints, made to order on the fabric that fits your
                project perfectly. Your vision, your material, your rules.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  to="/fabrics/shop"
                  className="rounded-md bg-[#212328] px-10 py-4 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-black"
                >
                  Shop Now
                </Link>
                <Link
                  to="/fabrics/shop"
                  className="rounded-md border-2 border-white bg-transparent px-10 py-4 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-white/10"
                >
                  VIEW ALL FABRICS
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-100 bg-white py-16">
          <div className="container mx-auto grid grid-cols-1 gap-12 px-4 text-center md:grid-cols-3 md:px-8">
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F7F6] text-[#2A2623]">
                <Star fill="currentColor" />
              </div>
              <p className="text-lg font-semibold text-[#2A2623]">Original Prints. Flexible Units.</p>
              <p className="mt-2 max-w-xs text-neutral-600">
                Browse active fabrics with transparent pricing across meter, swatch, quarter, and
                yard.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F7F6] text-[#2A2623]">
                <Star fill="currentColor" />
              </div>
              <p className="text-lg font-semibold text-[#2A2623]">Curated by Fabric Category</p>
              <p className="mt-2 max-w-xs text-neutral-600">
                Explore cottons, linens, velvets, and more through dedicated fabric-only category
                pages.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F7F6] text-[#2A2623]">
                <Star fill="currentColor" />
              </div>
              <p className="text-lg font-semibold text-[#2A2623]">Active Stock, Ready to Shop</p>
              <p className="mt-2 max-w-xs text-neutral-600">
                Public fabric feeds now surface active inventory only, so what you see is ready for
                customers to explore.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F4F0] py-24">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="mb-16 text-center font-serif text-4xl text-[#2A2623]">
              Shop Fabric by Collection
            </h2>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
              {collectionCategories.length > 0
                ? collectionCategories.map((category, index) => (
                    <Link
                      key={category.id}
                      to={`/fabrics/shop?categoryId=${category.id}`}
                      className="group"
                    >
                      <div className="aspect-square rounded-xl border border-neutral-100 bg-white p-4 shadow-sm transition group-hover:border-neutral-200 group-hover:shadow-md">
                        <img
                          src={getCategoryImage(category, fallbackCollections[index % fallbackCollections.length].image)}
                          alt={category.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      </div>
                      <p className="mt-4 text-center text-sm font-semibold text-neutral-800 transition-colors group-hover:text-black">
                        {category.name}
                      </p>
                    </Link>
                  ))
                : fallbackCollections.map((collection) => (
                    <Link key={collection.title} to="/fabrics/shop" className="group">
                      <div className="aspect-square rounded-xl border border-neutral-100 bg-white p-4 shadow-sm transition group-hover:border-neutral-200 group-hover:shadow-md">
                        <img
                          src={collection.image}
                          alt={collection.title}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      </div>
                      <p className="mt-4 text-center text-sm font-semibold text-neutral-800 transition-colors group-hover:text-black">
                        {collection.title}
                      </p>
                    </Link>
                  ))}
            </div>

            <div className="mt-16 flex justify-center">
              <Link
                to="/fabrics/shop"
                className="rounded-md border-2 border-[#2A2623] px-12 py-4 text-sm font-semibold tracking-wide text-[#2A2623] transition hover:bg-[#2A2623] hover:text-white"
              >
                Explore More Fabric Collections
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="mb-16 text-center font-serif text-4xl text-[#2A2623]">
              Shop Customer Favorites
            </h2>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {favoriteFabrics.map((fabric) => {
                const priceEntries = getFabricPriceEntries(fabric);

                return (
                  <Link
                    key={fabric.id}
                    to={getFabricPath(fabric)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-neutral-100 transition hover:border-neutral-200 hover:shadow-lg"
                  >
                    <div className="relative">
                      <img
                        src={getFabricImage(fabric)}
                        alt={fabric.title}
                        className="aspect-[4/3] w-full object-cover transition group-hover:scale-105"
                      />
                      {fabric.specialOffer && (
                        <span className="absolute left-4 top-4 rounded-full bg-[#BA1B1C] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                          Special Offer
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      <p className="truncate text-sm font-bold text-neutral-800">{fabric.title}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {getFabricMeta(fabric) || "Premium fabric"}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                        {priceEntries.map((entry) => (
                          <div key={entry.unit} className="text-xs">
                            <span className="block uppercase tracking-wide text-neutral-400">
                              {entry.label}
                            </span>
                            <span className="font-semibold text-[#2A2623]">
                              {formatPrice(entry.priceCents)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-1 text-[#FFD700]">
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <span className="ml-1 text-sm text-neutral-600">
                          {fabric.stockMeters ? `${fabric.stockMeters} m in stock` : "In stock"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-16 flex justify-center">
              <Link
                to="/fabrics/shop"
                className="rounded-md bg-[#2A2623] px-12 py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-black"
              >
                Discover Customer Favorites
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ExploreFabrics;
