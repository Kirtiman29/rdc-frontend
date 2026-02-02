import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Fetch curated selection from Port 8080
        const response = await getDesigns({ limit: 20 });
        const rawData = response.content || [];
        
        // ✅ FIXED: Using 'editorsPick' as the featured flag
        // ✅ SORT: Descending ID for Recent First
        const filteredFeatured = rawData
          .filter((product: Design) => product.editorsPick === true)
          .sort((a, b) => b.id - a.id)
          .slice(0, 4); 

        setProducts(filteredFeatured);
      } catch (error) {
        console.error('Failed to sync featured designs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      toast({
        title: "Added to Cart",
        description: `${product.title} has been added to your selection.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Cart Error",
        description: "Please login to add items to your selection.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-background py-16 md:py-24" onContextMenu={handleContextMenu}>
      <div className="container px-4 mx-auto">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Curated Selection
            </span>
            <h2 className="font-serif text-3xl font-medium md:text-4xl text-[#2A2623]">
              Featured Designs
            </h2>
          </div>
          <Link
            to="/gallery?editorsPick=true"
            className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-[#2A2623]"
          >
            View All
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link to={`/product/${product.id}`}>
                <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-sm bg-secondary select-none">
                  
                  {/* Industrial Watermark */}
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-[0.25]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='22' font-weight='900' fill='none' stroke='white' stroke-width='0.8' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                  />

                  <img
                    src={getAssetUrl(product.assetUuid)}
                    alt={product.title}
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Badges */}
                  <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
                    {product.premium && (
                      <span className="rounded-sm bg-[#2A2623] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                        Premium
                      </span>
                    )}
                    {product.newArrival && (
                      <span className="rounded-sm bg-blue-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                        New
                      </span>
                    )}
                  </div>

                  {/* Add to Cart button */}
                  <div className="absolute bottom-3 left-3 right-3 z-30 translate-y-2 opacity-100 md:opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Button
                      className="w-full gap-2 shadow-xl bg-[#2A2623] hover:bg-black uppercase text-[10px] font-bold tracking-widest rounded-sm h-10"
                      size="sm"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to Selection
                    </Button>
                  </div>

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors pointer-events-none" />
                </div>
              </Link>

              <div>
                <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {product.segment?.replace('_', ' ') || 'Textile'}
                </span>
                <Link to={`/product/${product.id}`}>
                  <h3 className="mb-2 font-serif text-lg font-medium transition-colors hover:text-muted-foreground text-[#2A2623] line-clamp-1 italic">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#2A2623]">
                    ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;