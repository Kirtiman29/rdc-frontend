import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { getNewArrivals } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';
import { getProductPath } from '@/utils/routes';
import { formatPrice } from '@/utils/price';

const NewArrivals = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const data: any = await getNewArrivals(24);
        const rawItems = Array.isArray(data) ? data : (data?.content || []);

        const sortedRecent = [...rawItems]
          .sort((a: Design, b: Design) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 8);

        setProducts(sortedRecent);
      } catch (error) {
        console.error('Failed to sync new arrivals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-[#FBFAF9]" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-6 md:px-12">

        {/* HEADER UPGRADE */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1A1A1A]/40 block mb-3">
              Latest Drop
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-4">
              New Arrivals
            </h2>
            <p className="text-neutral-500 text-sm md:text-base font-light leading-relaxed">
              Fresh fabric prints just in. Stay ahead with designs your competitors haven't sourced yet.
            </p>
          </div>
          <Link
            to="/gallery?newArrival=true"
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-1"
          >
            Explore the Drop <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* FEATURE BANNER (TOP ADD) */}
        <div className="mb-20 relative h-[350px] md:h-[450px] overflow-hidden rounded-sm group cursor-pointer">
          <img
            src={getAssetUrl(products[0]?.media?.find(m => m.role === "COVER")?.url || products[0]?.assetUuid)}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            alt="New Collection"
          />
          <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />

          <div className="absolute bottom-12 left-12 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] mb-3 block">Autumn / Winter '26</span>
            <h2 className="font-serif text-4xl md:text-5xl mb-4">
              The Minimalist <br /> Series
            </h2>
            <Link to="/gallery" className="inline-flex items-center gap-3 bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-colors">
              Shop Collection
            </Link>
          </div>
        </div>

        {/* CLEAN GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product) => (
            <div key={product.id} className="group flex flex-col">
              <Link
                to={getProductPath(product)}
                className="relative aspect-[3/4] overflow-hidden bg-neutral-200 mb-6 select-none"
              >
                {/* NEW TAG UPGRADE */}
                <div className="absolute top-4 left-4 z-20">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-white text-black px-2.5 py-1.5 shadow-sm">
                    New
                  </span>
                </div>

                {/* NO WATERMARK */}
                <img
                  src={getAssetUrl(
                    product.media?.find(m => m.role === "COVER")?.url || product.assetUuid
                  )}
                  alt={product.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />

                {/* Subtle Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />

                {/* Minimal View CTA */}
                <div className="absolute inset-0 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-[#1A1A1A] px-6 py-2 shadow-xl">
                    View Details
                  </span>
                </div>
              </Link>

              {/* CLEAN CARD DETAILS */}
              <div className="space-y-1">
                <Link to={getProductPath(product)}>
                  <h3 className="font-serif text-lg text-[#1A1A1A] group-hover:opacity-60 transition-opacity line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm text-neutral-400 font-medium tracking-tight">
                  {formatPrice(product.finalPriceCents || product.basePriceCents)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
