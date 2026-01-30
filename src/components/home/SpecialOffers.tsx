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

  // ✅ Security: Restrict Right-Click across the offers section
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await getDesigns({ limit: 4, specialOffer: true });
        const offerData = response.content || [];
        setProducts(offerData);

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
    <section className="py-20 md:py-28 bg-secondary/20" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-destructive">
              Limited Time
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2 text-[#2A2623]">
              Special Offers
            </h2>
          </div>
          <Link 
            to="/gallery?specialOffer=true" 
            className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-[#2A2623] transition-colors hidden md:block"
          >
            View All Offers →
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="group">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4 border border-destructive/10 select-none">
                  
                  {/* ✅ HIGH-VISIBILITY INDUSTRIAL WATERMARK OVERLAY */}
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
                    draggable={false} // ✅ Prevent image dragging
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Sale Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-destructive text-destructive-foreground px-3 py-1 shadow-sm">
                      Sale
                    </span>
                  </div>

                  {/* Discount Percentage */}
                  {product.discountPercent > 0 && (
                    <div className="absolute bottom-4 left-4 z-20">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-[#2A2623] px-3 py-1 rounded-sm border border-destructive/20 shadow-sm">
                        {product.discountPercent}% Off
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button 
                    className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md z-20 ${
                      wishlistState[product.id] ? 'bg-destructive text-white' : 'bg-white/80 text-[#2A2623]'
                    }`}
                    onClick={(e) => toggleWishlist(e, product)}
                  >
                    <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>

                  {/* Darkening security overlay */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
                </div>
              </Link>

              {/* Product Info */}
              <div className="space-y-1 px-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-lg text-[#2A2623] group-hover:text-muted-foreground transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-destructive">
                    ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
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
            className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-[#2A2623] transition-colors"
          >
            View All Offers →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;