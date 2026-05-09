import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { getEditorsPick } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';
import { getProductPath } from '@/utils/routes';

const EditorsChoice = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const data: any = await getEditorsPick(30);
        const rawItems = data?.content || (Array.isArray(data) ? data : []);

        const filteredPicks = rawItems
          .filter((product: Design) => product.editorsPick === true)
          .sort((a: Design, b: Design) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 7); // Perfect number for asymmetric grid

        setProducts(filteredPicks);
      } catch (error) {
        console.error('Failed to sync editor picks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPicks();
  }, []);

  if (loading) {
    return (
      <div className="py-40 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2A2623]" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-white" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-6 md:px-12">
        {/* HEADER UPGRADE */}
        <div className="max-w-3xl mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#2A2623]/40 block mb-4">
            Editor's Choice
          </span>
          <h2 className="font-serif text-5xl md:text-6xl text-[#2A2623] mb-6 tracking-tight">
            Curated by Experts
          </h2>
          <p className="text-[#2A2623]/60 text-base md:text-lg font-light leading-relaxed max-w-xl">
            Hand-picked print designs that are already turning heads — designs our team knows will move the moment they hit the market.
          </p>
        </div>

        {/* ASYMMETRIC SPOTLIGHT GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[250px] md:auto-rows-[300px] gap-6">
          {products.map((product, index) => {
            const isPrimaryHero = index === 0;
            const isWideHero = index === 5;

            return (
              <Link
                key={product.id}
                to={getProductPath(product)}
                className={`group relative overflow-hidden bg-neutral-100 transition-all duration-700 ${isPrimaryHero ? "md:col-span-2 md:row-span-2 col-span-2" :
                  isWideHero ? "md:col-span-2 col-span-2" :
                    "col-span-1"
                  }`}
              >
                {/* Visual - No Watermark */}
                <img
                  src={getAssetUrl(product.media?.find(m => m.role === "COVER")?.url || product.assetUuid)}
                  alt={product.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />

                {/* Editorial Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

                {/* Content Overlay */}
                <div className="absolute bottom-8 left-8 right-8 z-20">
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/60 block mb-2">
                    Editor's Pick
                  </span>
                  <h3 className={`font-serif text-white tracking-wide transition-all duration-500 ${isPrimaryHero || isWideHero ? "text-3xl md:text-4xl" : "text-xl"
                    }`}>
                    {product.title}
                  </h3>
                </div>

                {/* Hover Interaction CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 z-30 pointer-events-none">
                  <div className="flex items-center gap-3 text-white text-[10px] uppercase tracking-[0.3em] border-b border-white pb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    View Design <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* CTA Link - Integrated in Grid */}
          <Link
            to="/gallery"
            className="col-span-1 flex flex-col items-center justify-center border border-black/5 hover:bg-[#2A2623] hover:text-white transition-all group duration-500"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] mb-4">View All</span>
            <div className="w-12 h-12 rounded-full border border-black/10 group-hover:border-white/20 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EditorsChoice;
