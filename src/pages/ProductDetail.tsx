import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShoppingBag, Heart, Share2, Check, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { getDesignById, getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { checkWishlistStatus, addToWishlist, removeFromWishlist } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Design | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWished, setIsWished] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // ✅ Sync: Fetch Design metadata from Port 8080
        const designData = await getDesignById(Number(id));
        setProduct(designData);

        // ✅ Sync: Fetch related designs in the same segment
        const related = await getDesigns({ segment: designData.segment, limit: 4 });
        setRelatedProducts(related.content.filter(p => p.id !== designData.id));

        // ✅ Sync: Check wishlist status from Port 8093
        const wished = await checkWishlistStatus(designData.id);
        setIsWished(wished);
      } catch (error) {
        console.error('Failed to sync product details:', error);
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
      // ✅ Sync: Persist to Cart Service (Port 8091)
      await addToCart(product.id, quantity);
      toast({ title: "Added to Cart", description: `${quantity}x ${product.title} added.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Please login to add items." });
    } finally {
      setIsAdding(false);
    }
  };

  const toggleWishlist = async () => {
    if (!product) return;
    try {
      if (isWished) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      setIsWished(!isWished);
      toast({ title: isWished ? "Removed" : "Saved", description: "Wishlist updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Wishlist Error", description: "Authentication required." });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb - Industrial Sync */}
        <div className="border-b border-border bg-secondary/50">
          <div className="container px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/gallery" className="hover:text-foreground transition-colors">Collections</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to={`/gallery?segment=${product.segment}`} className="capitalize hover:text-foreground transition-colors">
                {product.segment?.replace('_', ' ')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{product.title}</span>
            </nav>
          </div>
        </div>

        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Image resolved via Asset Service (Port 8090) */}
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-sm bg-secondary">
                  <img
                    src={getAssetUrl(product.assetUuid)}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <div className="mb-4 flex gap-2">
                  {product.premium && (
                    <span className="bg-foreground px-2 py-1 text-xs font-medium uppercase tracking-wider text-background">Premium</span>
                  )}
                  {product.discountPercent > 0 && (
                    <span className="bg-destructive px-2 py-1 text-xs font-medium uppercase tracking-wider text-destructive-foreground">Sale</span>
                  )}
                </div>

                <span className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                  {product.category?.name || product.segment?.replace('_', ' ')}
                </span>

                <h1 className="mb-4 font-serif text-3xl font-medium md:text-4xl">{product.title}</h1>

                <div className="mb-6 flex items-baseline gap-3">
                  <span className="font-serif text-2xl font-medium">
                    ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{(product.basePriceCents / 100).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <p className="mb-8 leading-relaxed text-muted-foreground">{product.description}</p>

                {/* Industrial Specifications from Backend */}
                <div className="mb-8 space-y-3 border-y border-border py-6">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Asset Format</span>
                     <span className="font-medium">Industrial TIFF / High-Res AI</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">DPI / Resolution</span>
                     <span className="font-medium">300+ DPI Optimized</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">License Type</span>
                     <span className="font-medium">{product.premium ? 'Exclusive Commercial' : 'Standard Commercial'}</span>
                   </div>
                </div>

                {/* Quantity & Actions */}
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wider">Quantity</h3>
                  <div className="flex items-center border border-border w-fit">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors" disabled={quantity <= 1}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="h-10 w-12 flex items-center justify-center font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="flex-1 gap-2" disabled={!product.active || isAdding} onClick={handleAddToCart}>
                    {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
                    {product.active ? 'Add to Cart' : 'Unavailable'}
                  </Button>
                  <Button variant="outline" size="lg" className={isWished ? 'bg-primary/5' : ''} onClick={toggleWishlist}>
                    <Heart className={`h-5 w-5 ${isWished ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                </div>

                {product.active && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    Industrial asset ready for immediate streaming
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related Products - Sync'd with Segment */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-border bg-secondary/30 py-12 md:py-16">
            <div className="container px-4">
              <h2 className="mb-8 font-serif text-2xl font-medium">More from this Segment</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
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

export default ProductDetail;