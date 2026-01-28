import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const SpecialOffers = () => {
  const [offers, setOffers] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  // ✅ Industrial Sync: Fetching discounted designs from Port 8080
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        // We pass specialOffer: true to filter for discounted items at the source
        const response = await getDesigns({ specialOffer: true, limit: 12 });
        
        // Handle both Page object (response.content) and raw Array to ensure visibility
        const items = Array.isArray(response) ? response : (response.content || []);
        setOffers(items);

        // ✅ Sync: Check wishlist status for each item via Port 8093
        const statusMap: Record<number, boolean> = {};
        for (const item of items) {
          statusMap[item.id] = await checkWishlistStatus(item.id);
        }
        setWishlistState(statusMap);
      } catch (error) {
        console.error('Special Offers sync failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const toggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    const isWished = wishlistState[productId];
    try {
      if (isWished) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
      setWishlistState(prev => ({ ...prev, [productId]: !isWished }));
      toast({ title: isWished ? "Removed" : "Saved", description: "Wishlist updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Please login to save items." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Header Section preserved exactly */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-destructive">
              Limited Time
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6 text-foreground">
              Special Offers
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Exceptional designs at exclusive prices. 
              Premium quality patterns with savings that matter.
            </p>
          </div>
        </section>

        {/* Product Grid preserved exactly */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {offers.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-background rounded-sm overflow-hidden border border-border hover:border-muted-foreground/30 transition-colors animate-fade-in"
                >
                  {/* Sync: Discount Badge from Backend Percent */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 bg-destructive text-destructive-foreground text-[10px] font-medium uppercase tracking-wider">
                      {product.discountPercent}% Off
                    </span>
                  </div>

                  <button
                    onClick={(e) => toggleWishlist(e, product.id)}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all ${
                        wishlistState[product.id] ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>

                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-square overflow-hidden bg-secondary/20">
                      <img
                        src={getAssetUrl(product.assetUuid)}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    {/* Hover Overlay preserved */}
                    <div className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-background text-foreground text-xs font-medium uppercase tracking-wider">
                        <Eye className="h-3 w-3" />
                        Quick View
                      </span>
                    </div>
                  </Link>

                  <div className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      {product.segment?.replace('_', ' ')}
                    </p>
                    <h3 className="font-serif text-xl text-foreground mb-3 truncate">
                      {product.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    {/* Industrial Price Rendering */}
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-xl text-foreground">
                        ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                      </span>
                      <span className="text-muted-foreground line-through text-sm">
                        ₹{(product.basePriceCents / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {offers.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-4">
                  No special offers available at the moment.
                </p>
                <Link to="/gallery" className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium uppercase tracking-wider hover:bg-foreground/90 transition-colors">
                  Browse All Designs
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Section preserved exactly */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              Never Miss an Offer
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Subscribe to receive exclusive discounts and early access to special offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button className="px-6 h-12 bg-foreground text-background text-sm font-medium uppercase tracking-wider hover:bg-foreground/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SpecialOffers;