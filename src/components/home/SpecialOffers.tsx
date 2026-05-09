import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';
import { getProductPath } from '@/utils/routes';
import { formatPrice } from '@/utils/price';

const SpecialOffers = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response: any = await getDesigns({ size: 50, specialOffer: true });
        const rawData = response?.content || (Array.isArray(response) ? response : []);

        const filteredOffers = [...rawData]
          .filter((product: Design) => product.specialOffer === true)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 4);

        setProducts(filteredOffers);
      } catch (error) {
        console.error('Failed to sync special offers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center h-96 bg-[#FBFAF9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-[#FBFAF9] font-sans" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-6 md:px-12">

        {/* LUXURY CAMPAIGN HERO BANNER */}
        <div className="relative h-[350px] md:h-[420px] mb-20 overflow-hidden group cursor-pointer">
          {/* Banner Image - Using first product as the campaign visual */}
          <img
            src={getAssetUrl(products[0]?.media?.find(m => m.role === "COVER")?.url || products[0]?.assetUuid)}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            alt="Limited Edition Campaign"
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="absolute inset-0 flex flex-col items-start justify-center p-12 text-white">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-80">
              Limited Edition Selection
            </span>
            <h2 className="font-serif text-4xl md:text-6xl mb-6 max-w-xl leading-tight">
              Exclusive Offers
            </h2>
            <p className="text-sm md:text-base font-light tracking-wide mb-8 max-w-md opacity-90 italic">
              Every print designs is the result of hours of hand-crafted effort, exceptional attention to detail, and an exclusivity you will not find anywhere else. This is the standard we hold, and it is exactly what your premium collection deserves.
            </p>
            <Link
              to="/special-offers/explore"
              className="group flex items-center gap-4 bg-white text-black px-10 py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all duration-500"
            >
              Explore Collection <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </div>

        {/* MINIMAL PRODUCT STRIP (Max 4 Items) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product) => (
            <div key={product.id} className="group flex flex-col space-y-4">
              <Link
                to={getProductPath(product)}
                className="relative aspect-[3/4] overflow-hidden bg-neutral-200 select-none"
              >
                {/* SUBTLE LUXURY DISCOUNT BADGE */}
                <div className="absolute top-4 left-4 z-20">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-black/80 text-white px-3 py-1.5 backdrop-blur-sm shadow-sm">
                    {product.discountPercent}% Off
                  </span>
                </div>

                {/* CLEAN IMAGE - NO WATERMARK */}
                <img
                  src={getAssetUrl(product.media?.find(m => m.role === "COVER")?.url || product.assetUuid)}
                  alt={product.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />

                {/* Subtle Hover CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30">
                  <span className="text-white text-[9px] uppercase tracking-[0.4em] border-b border-white pb-2">
                    View Design
                  </span>
                </div>
              </Link>

              {/* CARD DETAILS */}
              <div className="space-y-1.5 px-1">
                <Link to={getProductPath(product)}>
                  <h3 className="font-serif text-lg text-[#1A1A1A] group-hover:opacity-60 transition-opacity line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {formatPrice(product.finalPriceCents)}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-[11px] text-neutral-400 line-through font-light decoration-neutral-300">
                      {formatPrice(product.basePriceCents)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;
