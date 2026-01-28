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

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // ✅ Sync: Fetch real-time designs from Admin Service (Port 8080)
        // Using the 'trending' or 'featured' logic defined in your backend
        const response = await getDesigns({ limit: 4, trending: true });
        setProducts(response.content || []);
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
      // ✅ Sync: Direct integration with Cart Service (Port 8091)
      await addToCart(product.id, 1);
      toast({
        title: "Added to Cart",
        description: `${product.title} has been added to your bag.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Cart Error",
        description: "Please login to add items to your cart.",
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
    <section className="bg-background py-16 md:py-24">
      <div className="container px-4">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Curated Selection
            </span>
            <h2 className="font-serif text-3xl font-medium md:text-4xl">
              Featured Designs
            </h2>
          </div>
          <Link
            to="/gallery"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
                <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
                  <img
                    // ✅ Sync: Resolved via Asset Service (Port 8090)
                    src={getAssetUrl(product.assetUuid)}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Premium badge */}
                  {product.premium && (
                    <span className="absolute left-3 top-3 rounded-sm bg-foreground/90 px-2 py-1 text-xs font-medium uppercase tracking-wider text-background">
                      Premium
                    </span>
                  )}

                  {/* Sale badge */}
                  {product.discountPercent > 0 && (
                    <span className="absolute right-3 top-3 rounded-sm bg-destructive px-2 py-1 text-xs font-medium uppercase tracking-wider text-destructive-foreground">
                      Sale
                    </span>
                  )}

                  {/* Quick add button */}
                  <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-100 md:opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Button
                      className="w-full gap-2"
                      size="sm"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Link>

              <div>
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  {product.category?.name || product.segment?.replace('_', ' ') || 'Textile'}
                </span>
                <Link to={`/product/${product.id}`}>
                  <h3 className="mb-2 font-serif text-lg font-medium transition-colors hover:text-muted-foreground">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2">
                  {/* ✅ Sync: Industrial Price Rendering (Paise to Rupees) */}
                  <span className="font-medium">
                    ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{(product.basePriceCents / 100).toLocaleString('en-IN')}
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

export default FeaturedProducts;