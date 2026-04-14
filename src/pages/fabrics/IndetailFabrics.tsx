// src/pages/fabrics/IndetailFabrics.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Heart, Loader2, 
  ShieldCheck, Info 
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { getFabricById, getFabrics } from '@/api/fabricApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design } from '@/types/product';

const isUnauthorizedError = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  );
};

const IndetailFabrics = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Design | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWished, setIsWished] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [activeMediaUrl, setActiveMediaUrl] = useState<string>('');
  const [activeMediaType, setActiveMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const designData = await getFabricById(Number(id)); 
        setProduct(designData);
        const cover = designData.media?.find((m) => m.role === "COVER");

        setActiveMediaUrl(
          cover ? getAssetUrl(cover.url) : getAssetUrl(designData.assetUuid)
        );
        setActiveMediaType('IMAGE');

        // Fetch Related (by segment)
        try {
          const primarySegment = designData.segments?.[0] || designData.segment;
          const res = await getFabrics({ segment: primarySegment, size: 5 });
          const content = (res.content || [])
            .filter((p: Design) => p.id !== designData.id);
          setRelatedProducts(content.slice(0, 4));
        } catch (err) {
          console.error('Related sync failed:', err);
        }

        const wished = await checkWishlistStatus(designData.id);
        setIsWished(wished);
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      toast({ title: "Added to Bag", description: `${product.title} has been added.` });
    } catch (error: unknown) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { state: { redirectTo: `/fabrics/design/${product.id}` } });
      }
    } finally { setIsAdding(false); }
  };

  if (loading || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-zinc-300" size={40} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans selection:bg-zinc-100" onContextMenu={handleContextMenu}>
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb - Clean & Minimal */}
        <nav className="border-b border-zinc-50 bg-white py-4">
          <div className="mx-auto max-w-[1400px] px-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              <Link to="/" className="hover:text-black transition-colors">Home</Link>
              <ChevronRight size={10} className="text-zinc-200" />
              <Link to="/fabrics/shop" className="hover:text-black transition-colors">Fabrics</Link>
              <ChevronRight size={10} className="text-zinc-200" />
              <span className="text-zinc-900">{product.title}</span>
            </div>
          </div>
        </nav>

        <section className="mx-auto max-w-[1400px] px-6 py-10 lg:py-16">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
            
            {/* LEFT: GALLERY SHOWCASE */}
            <div className="w-full lg:w-[60%]">
              <div className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-[#F9F9F9] border border-zinc-100">
                {/* Image Protection & Watermark */}
                <div className="absolute inset-0 z-20" onContextMenu={handleContextMenu} />
                <div 
                  className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
                  style={{ backgroundImage: `url("data:image/svg+xml,...")`, backgroundRepeat: 'repeat' }}
                />
                
                {activeMediaType === 'VIDEO' ? (
                  <video src={activeMediaUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={activeMediaUrl} alt={product.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
              </div>

              {/* Thumbnails */}
              {product.media && product.media.length > 1 && (
                <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {product.media.map((m, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { setActiveMediaUrl(getAssetUrl(m.url)); setActiveMediaType(m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE'); }}
                      className={`relative h-24 w-20 flex-shrink-0 border-2 transition-all ${activeMediaUrl === getAssetUrl(m.url) ? 'border-black' : 'border-transparent opacity-60'}`}
                    >
                      <img src={getAssetUrl(m.url)} className="h-full w-full object-cover" alt="Thumbnail" />
                    </button>
                  ))}
                </div>
              )}

              {/* Description Section */}
              <div className="mt-12 border-t border-zinc-100 pt-10">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-900 mb-6">Fabric Heritage & Care</h3>
                <div className="prose prose-sm max-w-none font-light leading-relaxed text-zinc-600">
                   {product.description?.split('\n').map((line, i) => (
                     <p key={i} className="mb-4">{line}</p>
                   ))}
                </div>
              </div>
            </div>

            {/* RIGHT: STICKY INFO PANEL */}
            <div className="sticky top-24 w-full lg:w-[40%]">
              <div className="flex flex-col">
                <div className="mb-4 flex items-center gap-2">
                  {product.luxury && (
                    <span className="bg-zinc-900 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white rounded-sm flex items-center gap-1">
                      <ShieldCheck size={10} /> Premium Textile
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-zinc-400 tracking-tighter uppercase">
                    Ref: {product.designIdentifier || `TX-${product.id}`}
                  </span>
                </div>

                <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 lg:text-5xl mb-6">
                  {product.title}
                </h1>

                <div className="mb-8 flex items-baseline gap-4 border-b border-zinc-100 pb-8">
                  <span className="text-3xl font-light text-zinc-900">
                    ₹{((product.specialOffer ? product.basePriceCents * (1 - product.discountPercent / 100) : product.basePriceCents) / 100).toLocaleString('en-IN')}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-lg text-zinc-300 line-through">
                      ₹{(product.basePriceCents / 100).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Technical Grid */}
                <div className="mb-10 grid grid-cols-2 gap-y-8 rounded-sm bg-zinc-50 p-6 border border-zinc-100">
                  {[
                    { label: 'Composition', value: product.imageType || 'Organic Cotton' },
                    { label: 'Weight/GSM', value: product.resolution ? `${product.resolution} GSM` : '220 GSM' },
                    { label: 'Width', value: product.repeatSize || '58 Inches' },
                    { label: 'Finish', value: product.imageFormat || 'Soft Matte' },
                    { label: 'Print Type', value: product.designType || 'Digital Reactive' },
                    { label: 'Lead Time', value: '7-10 Days' },
                  ].map((spec, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{spec.label}</span>
                      <span className="text-xs font-semibold text-zinc-800">{spec.value}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4">
                  <Button 
                    className="h-16 w-full rounded-sm bg-[#2A2623] text-[11px] font-bold uppercase tracking-[0.3em] transition-all hover:bg-black"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                  >
                    {isAdding ? <Loader2 className="animate-spin" /> : 'Acquire Fabric'}
                  </Button>
                  
                  <button 
                    onClick={() => setIsWished(!isWished)}
                    className="flex h-14 w-full items-center justify-center gap-3 border border-zinc-200 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors hover:bg-zinc-50"
                  >
                    <Heart size={14} className={isWished ? 'fill-red-500 stroke-red-500' : ''} />
                    {isWished ? 'Saved to Studio' : 'Save to Moodboard'}
                  </button>
                </div>

                {/* Minimalist Notices */}
                <div className="mt-10 space-y-4 border-t border-zinc-100 pt-8">
                  <div className="flex gap-3 text-[11px] text-zinc-500 leading-relaxed">
                    <Info size={14} className="shrink-0 text-zinc-400" />
                    <p>Sample swatches available upon request for verified trade accounts.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED SECTION */}
        {relatedProducts.length > 0 && (
          <section className="bg-zinc-50/50 py-20">
            <div className="mx-auto max-w-[1400px] px-6">
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Curated Collection</h4>
                  <h3 className="mt-2 text-2xl font-semibold text-zinc-900">Complementary Textures</h3>
                </div>
                <Link to="/fabrics" className="border-b border-black pb-1 text-[10px] font-bold uppercase tracking-widest">Explore All</Link>
              </div>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {relatedProducts.map(item => (
                  <ProductCard key={item.id} product={item} />
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
