import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDesignById, getDesigns } from "@/api/designApi";
import { getAssetUrl } from "@/api/apiClient";
import { addToCart } from "@/api/cartApi";
import {
  checkWishlistStatus,
  addToWishlist,
  removeFromWishlist,
} from "@/api/wishlistApi";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const LuxuryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState("");
  const [isWished, setIsWished] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const data = await getDesignById(Number(id));
      setProduct(data);

      const cover = data.media?.find((m: any) => m.role === "COVER");

      setActiveImage(
        cover ? getAssetUrl(cover.url) : getAssetUrl(data.assetUuid)
      );

      const wished = await checkWishlistStatus(data.id);
      setIsWished(wished);

      // 🔥 RELATED PRODUCTS
      try {
        const segment = data.segments?.[0] || data.segment;

        const res: any = await getDesigns({
          segment,
          size: 8,
        });

        const content = (Array.isArray(res) ? res : res?.content || []).filter(
          (p: any) => p.id !== data.id
        );

        setRelatedProducts(content.slice(0, 4));
      } catch (err) {
        console.error("Related fetch failed", err);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, 1);
    } catch {
      navigate("/login");
    }
  };

  const handleWishlist = async () => {
    try {
      if (isWished) {
        await removeFromWishlist(product.id);
        setIsWished(false);
      } else {
        await addToWishlist(product.id);
        setIsWished(true);
      }
    } catch {
      navigate("/login");
    }
  };

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      {/* 🔥 MAIN DARK SECTION */}
      <main className="bg-[#0a0a0a] text-white py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* LEFT - IMAGES */}
            <div>
              <div className="bg-black border border-white/10">
                <img
                  src={activeImage}
                  className="w-full object-contain"
                  alt={product.title}
                />
              </div>

              {/* THUMBNAILS */}
              <div className="flex gap-3 mt-4 overflow-x-auto">
                {product.media?.map((m: any, i: number) => (
                  <img
                    key={i}
                    src={getAssetUrl(m.url)}
                    onClick={() => setActiveImage(getAssetUrl(m.url))}
                    className="w-20 h-20 object-cover border border-white/10 cursor-pointer hover:border-[#c9a96e]"
                  />
                ))}
              </div>
            </div>

            {/* RIGHT - INFO */}
            <div className="lg:sticky top-24 h-fit">

              <h1 className="text-3xl md:text-4xl font-serif mb-3">
                {product.title}
              </h1>

              <p className="text-sm text-white/60 mb-6">
                By {product.artist || "RDC Studio"}
              </p>

              {/* PRICE */}
              <div className="mb-8">
                <p className="text-sm text-white/60">Price</p>
                <p className="text-2xl text-[#c9a96e] font-semibold">
                  ₹{Math.round(product.basePriceCents / 100)}
                </p>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-4 mb-10">
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-12 bg-[#c9a96e] text-black hover:bg-[#b8955c]"
                >
                  Add to Bag
                </Button>

                <button
                  onClick={handleWishlist}
                  className="w-full h-12 rounded-md border border-[#c9a96e] text-white transition-colors hover:bg-[#c9a96e] hover:text-black flex items-center justify-center gap-2"
                >
                  <Heart className={isWished ? "fill-red-500" : ""} />
                  {isWished ? "Saved" : "Add to Wishlist"}
                </button>
              </div>

              {/* DESCRIPTION */}
              {product.description && (
                <div className="mb-10">
                  <h3 className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] mb-4">
                    Description
                  </h3>

                  <ul className="space-y-2 text-sm text-white/70">
                    {product.description
                      .split("\n")
                      .filter((line: string) => line.trim() !== "")
                      .map((line: string, i: number) => (
                        <li key={i}>• {line}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* TAGS */}
              {product.tags && (
                <div className="mb-10">
                  <h3 className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] mb-4">
                    Tags
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 border border-white/20 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* DETAILS */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-[#c9a96e] mb-4">
                  Details
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
                  <div>Format: {product.imageFormat || "N/A"}</div>
                  <div>DPI: {product.resolution || "N/A"}</div>
                  <div>Repeat: {product.repeatSize || "Seamless"}</div>
                  <div>Colors: {product.colorCount || "N/A"}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* 🔥 RELATED SECTION (WHITE) */}
      {relatedProducts.length > 0 && (
        <section className="bg-[#0a0a0a] py-20 border-t border-[#c9a96e]/30">
          <div className="max-w-[1200px] mx-auto px-6">

            <h2 className="text-2xl font-semibold mb-10 text-[#ffffff]">
              Related Designs
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link key={item.id} to={`/luxury/design/${item.id}`}>
                  <div className="border border-[#c9a96e]/40 hover:border-[#c9a96e] hover:shadow-md transition">

                    <img
                      src={getAssetUrl(item.assetUuid)}
                      className="w-full aspect-square object-cover"
                    />

                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-1 text-white">
                        {item.title}
                      </p>

                      <p className="text-xs text-gray-200 mt-1">
                        ₹{Math.round(item.basePriceCents / 100)}
                      </p>
                    </div>

                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default LuxuryDetail;