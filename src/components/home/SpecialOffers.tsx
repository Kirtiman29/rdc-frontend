import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const SpecialOffers = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        // ✅ Sync: Fetch real-time special offers from Admin Service (Port 8080)
        const response = await getDesigns({ limit: 4, specialOffer: true });
        const offerData = response.content || [];
        setProducts(offerData);

        // ✅ Sync: Check wishlist status from Wishlist Service (Port 8093)
        const statusMap: Record<number, boolean> = {};
        for (const product of offerData) {
          statusMap[product.id] = await checkWishlistStatus(product.id);
        }
        setWishlistState(statusMap);
      } catch (error) {
        console.error('Failed to sync special offers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    const isWished = wishlistState[product.id];
    try {
      if (isWished) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      setWishlistState(prev => ({ ...prev, [product.id]: !isWished }));
      toast({
        title: isWished ? "Removed from Wishlist" : "Saved to Wishlist",
        description: "Your selection has been updated."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Wishlist Error",
        description: "Please login to save your favorite designs."
      });
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-destructive" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-secondary/20">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-destructive">
              Limited Time
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Special Offers
            </h2>
          </div>
          <Link 
            to="/gallery?specialOffer=true" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            View All Offers →
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="group">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4 border border-destructive/20">
                  <img
                    // ✅ Sync: Resolved via Asset Service (Port 8090)
                    src={getAssetUrl(product.assetUuid)}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Sale Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-medium uppercase tracking-wider bg-destructive text-destructive-foreground px-3 py-1">
                      Sale
                    </span>
                  </div>

                  {/* Discount Percentage - Sync'd with Admin Service logic */}
                  {product.discountPercent > 0 && (
                    <div className="absolute bottom-4 left-4">
                      <span className="text-xs font-medium uppercase tracking-wider bg-background/90 backdrop-blur-sm px-3 py-1 rounded-sm">
                        {product.discountPercent}% Off
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button 
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md ${
                      wishlistState[product.id] ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                    }`}
                    onClick={(e) => toggleWishlist(e, product)}
                  >
                    <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                </div>
              </Link>

              {/* Product Info */}
              <div className="space-y-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2">
                  {/* ✅ Sync: Industrial Price Rendering (Paise to Rupees) */}
                  <span className="text-sm font-medium text-destructive">
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

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link 
            to="/gallery?specialOffer=true" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View All Offers →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;