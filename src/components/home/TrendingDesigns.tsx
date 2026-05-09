//src/components/home/TrendingDesigns.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { getTrendingDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';
import { getProductPath } from '@/utils/routes';
import { formatPrice } from '@/utils/price';

const TrendingDesigns = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data: any = await getTrendingDesigns(12);
        const rawItems = Array.isArray(data) ? data : (data?.content || []);

        const filteredTrending = [...rawItems]
          .filter((product: Design) => product.trending === true)
          .sort((a: Design, b: Design) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 9);

        setProducts(filteredTrending);

        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (token) {
          const statusEntries = await Promise.all(
            filteredTrending.map(async (product: Design) => {
              const isWished = await checkWishlistStatus(product.id);
              return [product.id, isWished];
            })
          );
          setWishlistState(Object.fromEntries(statusEntries));
        }
      } catch (error) {
        console.error('Failed to sync trending designs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (!token) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please login to save designs."
      });
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    const isWished = wishlistState[product.id];

    try {
      if (isWished) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      setWishlistState((prev) => ({ ...prev, [product.id]: !isWished }));
      toast({
        title: isWished ? "Removed" : "Saved",
        description: "Your selection has been updated."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Wishlist Error"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-[#FBFAF9] py-14 font-sans sm:py-16 md:py-24" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-10 h-[1px] w-full bg-neutral-200 sm:mb-12 md:mb-16" />

        <div className="mb-10 flex flex-col gap-6 sm:mb-12 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 block text-xs font-bold uppercase tracking-[0.3em] text-[#2A2623]">
              Curated Selection
            </span>
            <h2 className="text-3xl font-serif text-[#2A2623] sm:text-4xl md:text-5xl">
              Trending Designs
            </h2>
            <p className="mt-4 max-w-xl text-base text-[#2A2623]/70 sm:text-lg">
              Trending designs that match today's consumer taste are selling out fast source now and stay ahead before anyone else does.
            </p>
          </div>

          <div className="shrink-0 pb-1 md:pb-2">
            <Link
              to="/trends/explore"
              className="inline-flex items-center border-b border-[#2A2623]/30 pb-1 text-xs font-bold uppercase tracking-[0.22em] text-[#2A2623] transition-colors hover:text-[#2A2623]/70 sm:text-sm"
            >
              Explore Collection <span className="ml-2">-&gt;</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 animate-fade-in sm:grid-cols-2 sm:auto-rows-[240px] sm:gap-5 md:grid-cols-4 md:auto-rows-[280px] lg:auto-rows-[300px] lg:gap-6">
          {products.map((product, index) => (
            <Link
              key={product.id}
              to={getProductPath(product)}
              className={`group relative block min-h-[280px] overflow-hidden bg-neutral-100 ${
                [0, 3, 5].includes(index % 9) ? "sm:row-span-2" : ""
              }`}
            >
              <img
                src={getAssetUrl(
                  product.media?.find((m) => m.role === "COVER")?.url || product.assetUuid
                )}
                alt={product.title}
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-90 transition-all duration-700 group-hover:bg-black/30" />

              <div className="absolute right-4 top-4 z-20 flex flex-col gap-2 opacity-100 transition-opacity duration-500 sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                    wishlistState[product.id]
                      ? 'bg-[#2A2623] text-white'
                      : 'bg-white/90 text-[#2A2623] backdrop-blur hover:bg-white'
                  }`}
                  onClick={(e) => toggleWishlist(e, product)}
                >
                  <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="absolute bottom-5 left-5 right-5 z-20 flex h-full flex-col justify-end text-white sm:bottom-6 sm:left-6 sm:right-6">
                <span className="mb-2 text-[10px] font-bold uppercase tracking-widest opacity-100 transition-all duration-500 sm:mb-3 sm:-translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                  View Design -&gt;
                </span>
                <h3 className="font-serif text-xl leading-tight drop-shadow-sm transition-transform duration-500 group-hover:-translate-y-1 sm:text-2xl">
                  {product.title}
                </h3>
                <p className="mt-1.5 text-sm font-medium opacity-80 transition-transform duration-500 group-hover:-translate-y-1">
                  {formatPrice(product.finalPriceCents || product.basePriceCents)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingDesigns;
