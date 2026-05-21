import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, Heart, Loader2, Info, Tag } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import { getFabricBySlugOrId, getFabrics } from "@/api/fabricApi";
import { getAssetUrl } from "@/api/apiClient";
import { addToCart } from "@/api/cartApi";
import { checkWishlistStatus } from "@/api/wishlistApi";
import { useCanonicalLink } from "@/hooks/useCanonicalLink";
import { useToast } from "@/hooks/use-toast";
import type { Design } from "@/types/product";
import { getFabricPath } from "@/utils/routes";
import { formatPrice } from "@/utils/price";
import {
  getFabricPriceEntries,
  getFabricPrimaryOriginalPriceCents,
  getFabricPrimaryPriceCents,
} from "@/utils/fabrics";

const isUnauthorizedError = (error: unknown) => {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  );
};

const IndetailFabrics = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Design | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWished, setIsWished] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeMediaUrl, setActiveMediaUrl] = useState("");
  const [activeMediaType, setActiveMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");

  const canonicalPath = product ? getFabricPath(product) : undefined;
  const canonicalUrl =
    canonicalPath && typeof window !== "undefined" ? `${window.location.origin}${canonicalPath}` : undefined;

  const priceEntries = useMemo(() => (product ? getFabricPriceEntries(product) : []), [product]);
  const primaryPrice = product ? getFabricPrimaryPriceCents(product) : 0;
  const primaryOriginalPrice = product ? getFabricPrimaryOriginalPriceCents(product) : undefined;

  useCanonicalLink(canonicalUrl);

  useEffect(() => {
    const fetchFullData = async () => {
      if (!slug) return;

      setLoading(true);

      try {
        const fabricData = await getFabricBySlugOrId(slug);
        setProduct(fabricData);

        if (fabricData.slug && slug !== fabricData.slug) {
          navigate(getFabricPath(fabricData), { replace: true });
        }

        const cover = fabricData.media?.find((media) => media.role === "COVER");
        setActiveMediaUrl(cover ? getAssetUrl(cover.url) : getAssetUrl(fabricData.assetUuid));
        setActiveMediaType("IMAGE");

        try {
          const relatedResponse = await getFabrics({
            categoryId: fabricData.categoryId,
            size: 8,
            sortBy: "createdAt,desc",
          });

          const related = relatedResponse.content.filter((item) => item.id !== fabricData.id).slice(0, 4);
          setRelatedProducts(related);
        } catch (error) {
          console.error("Related sync failed:", error);
        }

        const wished = await checkWishlistStatus(fabricData.id);
        setIsWished(wished);
      } catch (error) {
        console.error("Sync failed:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchFullData();
  }, [navigate, slug]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true);

    try {
      await addToCart(product.id, 1);
      toast({ title: "Added to Bag", description: `${product.title} has been added.` });
    } catch (error: unknown) {
      if (isUnauthorizedError(error)) {
        navigate("/login", { state: { redirectTo: getFabricPath(product) } });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  if (loading || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-zinc-300" size={40} />
      </div>
    );
  }

  const specificationRows = [
    { label: "Category", value: product.category?.name || "Uncategorized" },
    { label: "Material", value: product.material || product.imageType || "Not specified" },
    { label: "Width", value: product.width ? `${product.width} Inches` : "Not specified" },
    { label: "GSM", value: product.gsm ? `${product.gsm}` : "Not specified" },
    { label: "Length", value: product.length || "Not specified" },
    {
      label: "Stock Meters",
      value: typeof product.stockMeters === "number" ? `${product.stockMeters} m` : "Not specified",
    },
    {
      label: "Stock Quantity",
      value: typeof product.stockQuantity === "number" ? `${product.stockQuantity} pcs` : "Not specified",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans selection:bg-zinc-100" onContextMenu={handleContextMenu}>
      <Header />

      <main className="flex-1">
        <nav className="border-b border-zinc-50 bg-white py-4">
          <div className="mx-auto max-w-[1400px] px-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              <Link to="/" className="transition-colors hover:text-black">Home</Link>
              <ChevronRight size={10} className="text-zinc-200" />
              <Link to="/fabrics/shop" className="transition-colors hover:text-black">Fabrics</Link>
              <ChevronRight size={10} className="text-zinc-200" />
              <span className="text-zinc-900">{product.title}</span>
            </div>
          </div>
        </nav>

        <section className="mx-auto max-w-[1400px] px-6 py-10 lg:py-16">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
            <div className="w-full lg:w-[60%]">
              <div className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-zinc-100 bg-[#F9F9F9]">
                <div className="absolute inset-0 z-20" onContextMenu={handleContextMenu} />
                <div
                  className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,...\")", backgroundRepeat: "repeat" }}
                />

                {activeMediaType === "VIDEO" ? (
                  <video src={activeMediaUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={activeMediaUrl}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </div>

              {product.media && product.media.length > 1 && (
                <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {product.media.map((media, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setActiveMediaUrl(getAssetUrl(media.url));
                        setActiveMediaType(media.type === "VIDEO" ? "VIDEO" : "IMAGE");
                      }}
                      className={`relative h-24 w-20 flex-shrink-0 border-2 transition-all ${
                        activeMediaUrl === getAssetUrl(media.url) ? "border-black" : "border-transparent opacity-60"
                      }`}
                    >
                      <img src={getAssetUrl(media.url)} className="h-full w-full object-cover" alt="Thumbnail" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-12 border-t border-zinc-100 pt-10">
                <h3 className="mb-6 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-900">
                  Fabric Description
                </h3>
                <div className="prose prose-sm max-w-none font-light leading-relaxed text-zinc-600">
                  {product.description?.split("\n").map((line, index) => (
                    <p key={index} className="mb-4">{line}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky top-24 w-full lg:w-[40%]">
              <div className="flex flex-col">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {product.specialOffer && (
                    <span className="flex items-center gap-1 rounded-sm bg-[#BA1B1C] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                      <Tag size={10} />
                      Special Offer
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400">
                    Ref: {product.designIdentifier || `FAB-${product.id}`}
                  </span>
                </div>

                <h1 className="mb-3 text-4xl font-semibold tracking-tight text-zinc-900 lg:text-5xl">
                  {product.title}
                </h1>

                <p className="mb-8 text-sm uppercase tracking-[0.22em] text-zinc-400">
                  {product.category?.name || "Fabric Collection"}
                </p>

                <div className="mb-8 flex items-baseline gap-4 border-b border-zinc-100 pb-8">
                  <span className="text-3xl font-light text-zinc-900">{formatPrice(primaryPrice)}</span>
                  {product.discountPercent > 0 && primaryOriginalPrice !== undefined && (
                    <span className="text-lg text-zinc-300 line-through">
                      {formatPrice(primaryOriginalPrice)}
                    </span>
                  )}
                </div>

                {priceEntries.length > 0 && (
                  <div className="mb-8 rounded-sm border border-zinc-100 bg-white">
                    <div className="border-b border-zinc-100 px-6 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                        Unit Pricing
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-6">
                      {priceEntries.map((entry) => (
                        <div key={entry.unit} className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                            {entry.label}
                          </span>
                          <span className="text-sm font-semibold text-zinc-900">
                            {formatPrice(entry.priceCents)}
                          </span>
                          {product.discountPercent > 0 &&
                            entry.originalPriceCents !== undefined &&
                            entry.originalPriceCents > entry.priceCents && (
                              <span className="text-xs text-zinc-400 line-through">
                                {formatPrice(entry.originalPriceCents)}
                              </span>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-10 grid grid-cols-2 gap-y-8 rounded-sm border border-zinc-100 bg-zinc-50 p-6">
                  {specificationRows.map((spec) => (
                    <div key={spec.label} className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        {spec.label}
                      </span>
                      <span className="text-xs font-semibold text-zinc-800">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <Button
                    className="h-16 w-full rounded-sm bg-[#2A2623] text-[11px] font-bold uppercase tracking-[0.3em] transition-all hover:bg-black"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                  >
                    {isAdding ? <Loader2 className="animate-spin" /> : "Acquire Fabric"}
                  </Button>

                  <button
                    onClick={() => setIsWished(!isWished)}
                    className="flex h-14 w-full items-center justify-center gap-3 border border-zinc-200 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors hover:bg-zinc-50"
                  >
                    <Heart size={14} className={isWished ? "fill-red-500 stroke-red-500" : ""} />
                    {isWished ? "Saved to Studio" : "Save to Moodboard"}
                  </button>
                </div>

                <div className="mt-10 space-y-4 border-t border-zinc-100 pt-8">
                  <div className="flex gap-3 text-[11px] leading-relaxed text-zinc-500">
                    <Info size={14} className="shrink-0 text-zinc-400" />
                    <p>
                      Public fabric pages show active fabrics only, with live category links and unit pricing from the
                      latest catalog feed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="bg-zinc-50/50 py-20">
            <div className="mx-auto max-w-[1400px] px-6">
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">
                    Curated Collection
                  </h4>
                  <h3 className="mt-2 text-2xl font-semibold text-zinc-900">Related Fabrics</h3>
                </div>
                <Link to="/fabrics/shop" className="border-b border-black pb-1 text-[10px] font-bold uppercase tracking-widest">
                  Explore All
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {relatedProducts.map((item) => (
                  <ProductCard key={item.id} product={item} redirectPath="/fabrics" />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default IndetailFabrics;
