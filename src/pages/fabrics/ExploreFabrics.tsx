import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import fabricsBanner from "@/assets/fabrics-banner.jpg"; 
import pattern1 from "@/assets/sample-pattern-1.jpg"; 
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";
import pattern5 from "@/assets/sample-pattern-5.jpg";
import pattern6 from "@/assets/sample-pattern-6.jpg";
import { Star } from "lucide-react";
import { getFabrics } from "@/api/fabricApi";
import { getAssetUrl } from "@/api/apiClient";
import { formatPrice } from "@/utils/price";
import type { Design } from "@/types/product";

const fallbackCollections = [
  { image: pattern1, title: "Field & Feather" },
  { image: pattern2, title: "Coquette Spring Dreams" },
  { image: pattern3, title: "Coastal Boho" },
  { image: pattern4, title: "Spring & Easter" },
  { image: pattern5, title: "Cottage Daydream" },
  { image: pattern6, title: "Minimalist Vibes" },
];

const fallbackFavorites = [
  { image: pattern1, title: "Classic Navy Stripes on Linen", byline: "by Studio RDC", reviews: 128, rating: 5 },
  { image: pattern2, title: "Botanical Leaf on Cotton Poplin", byline: "by Bloom Collective", reviews: 95, rating: 5 },
  { image: pattern3, title: "Abstract Geo on Velvet", byline: "by Modernist", reviews: 88, rating: 4 },
  { image: pattern4, title: "Watercolor Floral on Silky Satin", byline: "by Art & Soul", reviews: 210, rating: 5 },
];

const getFabricImage = (fabric: Design) => {
  const cover = fabric.media?.find((item) => item.role === "COVER");
  return getAssetUrl(cover?.url || fabric.assetUuid);
};

const getFabricMeta = (fabric: Design) => {
  const parts = [
    fabric.imageType,
    fabric.resolution ? `${fabric.resolution} GSM` : undefined,
    fabric.repeatSize,
  ].filter(Boolean);

  return parts.join(" - ");
};

// Icon components mapping based on Spoonflower design
const UniquePrintsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SupportingArtistsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PrintedInUSAIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExploreFabrics = () => {
  const [fabrics, setFabrics] = useState<Design[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchFabrics = async () => {
      try {
        const response = await getFabrics();
        if (isMounted) {
          setFabrics(response.content.filter((fabric) => fabric.active));
        }
      } catch (error) {
        console.error("Failed to load public fabrics:", error);
      }
    };

    fetchFabrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const collectionFabrics = fabrics.slice(0, 6);
  const favoriteFabrics = fabrics.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      <Header />

      <main className="flex-1">
        {/* --- HERO SECTION WITH BANNER --- */}
        <section className="relative h-[60vh] md:h-[70vh]">
          {/* Banner Image */}
          <img
            src={fabricsBanner}
            alt="Textile Treasures Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Banner Text Content */}
          <div className="absolute inset-0 bg-black/40 flex items-center">
            <div className="container mx-auto px-4 md:px-8 text-center text-white">
              <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight">
                FABRIC THAT FITS EXACTLY WHAT YOU NEED
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-neutral-100 font-medium">
                Thousands of original artist prints, made to order on the fabric that fits your project perfectly. Your vision, your material, your rules.
              </p>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <Link
                  to="/fabrics/shop"
                  className="px-10 py-4 bg-[#212328] text-white rounded-md text-sm font-semibold tracking-wide hover:bg-black transition-colors"
                >
                  Shop Now
                </Link>
                <Link
                  to="/fabrics/material-types"
                  className="px-10 py-4 bg-transparent border-2 border-white text-white rounded-md text-sm font-semibold tracking-wide hover:bg-white/10 transition-colors"
                >
                  VIEW ALL FABRICS
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURE HIGHLIGHTS --- */}
        <section className="py-16 bg-white border-y border-neutral-100">
          <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {/* Feature 1 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#E5F7F6] flex items-center justify-center text-[#2A2623] mb-6">
                <UniquePrintsIcon />
              </div>
              <p className="text-lg font-semibold text-[#2A2623]">
                1,000,000 Prints. Zero Compromises.
              </p>
              <p className="text-neutral-600 mt-2 max-w-xs">
                Every project deserves the perfect print. With over a million original designs, yours is already waiting for apparel, home, and everything in between.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#E5F7F6] flex items-center justify-center text-[#2A2623] mb-6">
                <SupportingArtistsIcon />
              </div>
              <p className="text-lg font-semibold text-[#2A2623]">
                Artists Don't Get Paid Enough. We Fixed That.
              </p>
              <p className="text-neutral-600 mt-2 max-w-xs">
                 Every single order goes directly to the creator behind the print. No middlemen. No cuts. Just real money in real hands.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#E5F7F6] flex items-center justify-center text-[#2A2623] mb-6">
                <PrintedInUSAIcon />
              </div>
              <p className="text-lg font-semibold text-[#2A2623]">
                Printed on Demand. Wasted on Nothing.
              </p>
              <p className="text-neutral-600 mt-2 max-w-xs">
                Every order is printed fresh — no overstock, no waste, no guilt. Better for your project and better
              </p>
            </div>
          </div>
        </section>

        {/* --- SHOP BY COLLECTION --- */}
        <section className="py-24 bg-[#F5F4F0]">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="font-serif text-4xl text-[#2A2623] text-center mb-16">
              Shop Fabric by Collection
            </h2>

            {/* Collection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {collectionFabrics.length > 0
                ? collectionFabrics.map((fabric) => (
                    <Link key={fabric.id} to={`/fabrics/design/${fabric.id}`} className="group">
                      <div className="aspect-square bg-white p-4 rounded-xl border border-neutral-100 shadow-sm group-hover:border-neutral-200 group-hover:shadow-md transition">
                        <img
                          src={getFabricImage(fabric)}
                          alt={fabric.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-neutral-800 text-center group-hover:text-black transition-colors">
                        {fabric.title}
                      </p>
                    </Link>
                  ))
                : fallbackCollections.map((collection) => (
                    <Link key={collection.title} to="#" className="group">
                      <div className="aspect-square bg-white p-4 rounded-xl border border-neutral-100 shadow-sm group-hover:border-neutral-200 group-hover:shadow-md transition">
                        <img
                          src={collection.image}
                          alt="Collection Pattern"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-neutral-800 text-center group-hover:text-black transition-colors">
                        {collection.title}
                      </p>
                    </Link>
                  ))}
            </div>

            {/* Explore More Button */}
            <div className="mt-16 flex justify-center">
              <Link
                to="/fabrics/shop"
                className="px-12 py-4 border-2 border-[#2A2623] text-[#2A2623] rounded-md text-sm font-semibold tracking-wide hover:bg-[#2A2623] hover:text-white transition"
              >
                Explore More Fabric Collections
              </Link>
            </div>
          </div>
        </section>

        {/* --- CUSTOMER FAVORITES --- */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="font-serif text-4xl text-[#2A2623] text-center mb-16">
              Shop Customer Favorites
            </h2>

            {/* Favorite Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {favoriteFabrics.length > 0
                ? favoriteFabrics.map((fabric) => (
                    <Link
                      key={fabric.id}
                      to={`/fabrics/design/${fabric.id}`}
                      className="flex flex-col group border border-neutral-100 rounded-xl overflow-hidden hover:border-neutral-200 hover:shadow-lg transition"
                    >
                      <img
                        src={getFabricImage(fabric)}
                        alt={fabric.title}
                        className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition"
                      />
                      <div className="p-6">
                        <p className="text-sm font-bold text-neutral-800 truncate">
                          {fabric.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {getFabricMeta(fabric) || "Premium fabric"} - {formatPrice(fabric.finalPriceCents)} / meter
                        </p>
                        <div className="flex items-center gap-1 text-[#FFD700] mt-3">
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <Star size={16} fill="currentColor" />
                          <span className="text-sm text-neutral-600 ml-1">
                            In stock
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                : fallbackFavorites.map((favorite) => (
                    <div key={favorite.title} className="flex flex-col group border border-neutral-100 rounded-xl overflow-hidden hover:border-neutral-200 hover:shadow-lg transition">
                      <img
                        src={favorite.image}
                        alt="Customer Favorite Pattern"
                        className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition"
                      />
                      <div className="p-6">
                        <p className="text-sm font-bold text-neutral-800 truncate">
                          {favorite.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{favorite.byline}</p>
                        <div className="flex items-center gap-1 text-[#FFD700] mt-3">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={16}
                              fill={index < favorite.rating ? "currentColor" : "none"}
                            />
                          ))}
                          <span className="text-sm text-neutral-600 ml-1">
                            ({favorite.reviews} Reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            {/* Explore Favorites Button */}
            <div className="mt-16 flex justify-center">
              <Link
                to="/fabrics/shop"
                className="px-12 py-4 bg-[#2A2623] text-white rounded-md text-sm font-semibold tracking-wide hover:bg-black transition"
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
