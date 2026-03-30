import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Loader2, 
  ChevronLeft, 
  ShoppingBag, 
  Heart, 
  Eye, 
  Filter,
  Tag
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ProductFilters, FilterContent } from '@/components/products/ProductFilters';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import type { Design, ProductFilter } from '@/types/product';
import { formatPrice } from '@/utils/price';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const SpecialOffers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  
  // Pagination
  const [page, setPage] = useState(Number(searchParams.get('page')) || 0);
  const PAGE_SIZE = 24;

  const [filters, setFilters] = useState<ProductFilter>({
    categoryId: searchParams.get('category') ? Number(searchParams.get('category')) : undefined,
    segment: searchParams.get('segment') || undefined,
    luxury: searchParams.get('luxury') === 'true',
    specialOffer: true, // Strictly for this page
    sortBy: searchParams.get('sortBy') || 'createdAt,desc',
  });

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== false && v !== '')
      );

      const response: any = await getDesigns({
        ...cleanedFilters,
        page: page,
        size: PAGE_SIZE,
      });

      const rawContent = response?.content || (Array.isArray(response) ? response : []);
      // Ensure newest items appear first within the page
      const sortedContent = [...rawContent].sort((a, b) => b.id - a.id);
      
      setDesigns(sortedContent);
      setTotalElements(response?.totalElements || sortedContent.length);

      // Sync Wishlist Status
      const statusEntries = await Promise.all(
        sortedContent.map(async (d: Design) => [d.id, await checkWishlistStatus(d.id)])
      );
      setWishlistState(Object.fromEntries(statusEntries));

    } catch (error) {
      console.error('Special Offers shop sync failed:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchOffers();
    const newParams: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== false && value !== '' && key !== 'specialOffer') {
        newParams[key === "categoryId" ? "category" : key] = String(value);
      }
    });
    if (page > 0) newParams.page = String(page);
    setSearchParams(newParams, { replace: true });
  }, [filters, page, fetchOffers, setSearchParams]);

  const handleFilterChange = (newFilters: ProductFilter) => {
    setFilters({ ...newFilters, specialOffer: true });
    setPage(0);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    try {
      await addToCart(product.id, 1);
      toast({ title: "Selection Updated", description: `${product.title} added to cart.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Cart Error" });
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    const isWished = wishlistState[productId];
    try {
      isWished ? await removeFromWishlist(productId) : await addToWishlist(productId);
      setWishlistState(prev => ({ ...prev, [productId]: !isWished }));
      toast({ title: isWished ? "Removed" : "Saved to wishlist" });
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  return (
    <div className="flex min-h-screen flex-col bg-[#FBFAF9] selection:bg-rose-100">
      <Header />
      
      <main className="flex-1">
        {/* Banner Section */}
        <section className="py-12 md:py-20 border-b border-neutral-100 bg-white">
          <div className="container px-4 mx-auto md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  <Link to="/" className="hover:text-[#2A2623] transition-colors">Studio</Link>
                  <ChevronRight size={12} />
                  <span className="text-rose-600">Special Offers</span>
                </nav>
                <div className="flex items-center gap-3 text-rose-600">
                  <Tag size={24} strokeWidth={1.5} />
                  <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-none">
                    Privileged Access
                  </h1>
                </div>
                <p className="text-neutral-500 text-sm max-w-lg font-light leading-relaxed">
                  Exceptional archival designs and seasonal repeats, thoughtfully priced for professional production.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Items on Offer</p>
                <p className="text-2xl font-serif text-[#2A2623] tabular-nums">{totalElements}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container px-4 mx-auto md:px-8">
            <div className="flex flex-col lg:flex-row gap-12">
              
              {/* Sidebar Filters */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-32 space-y-8">
                  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-neutral-200">
                    <Filter size={14} />
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2A2623]">Refine Selection</h2>
                  </div>
                  <FilterContent filters={filters} onFiltersChange={handleFilterChange} />
                </div>
              </aside>

              {/* Grid Area */}
              <div className="flex-1 space-y-8">
                <div className="flex items-center justify-between lg:justify-end">
                  <div className="lg:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 text-[10px] font-bold uppercase tracking-widest rounded-none border-neutral-300">
                          <Filter size={14} /> Refine
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[300px]">
                        <SheetHeader className="mb-8">
                          <SheetTitle className="font-serif text-2xl text-left">Refine Offers</SheetTitle>
                        </SheetHeader>
                        <FilterContent filters={filters} onFiltersChange={handleFilterChange} />
                      </SheetContent>
                    </Sheet>
                  </div>
                  
                  <ProductFilters
                    filters={filters}
                    onFiltersChange={handleFilterChange}
                    productCount={totalElements}
                  />
                </div>

                {loading ? (
                  <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2A2623]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 italic">Syncing Offers...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
                      {designs.map((product) => (
                        <div key={product.id} className="group relative bg-white border border-neutral-100 hover:border-rose-200 transition-all duration-500 shadow-sm hover:shadow-2xl">
                          
                          {/* Image Block */}
                          <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50">
                             {/* Protection Layer */}
                             <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.12]"
                                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' font-weight='900' fill='none' stroke='white' stroke-width='0.4' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")` }} />
                            
                            <Link to={`/product/${product.id}`}>
                              <img
                                src={getAssetUrl(product.assetUuid)}
                                alt={product.title}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                              />
                            </Link>
                            
                            {/* Tags & Actions */}
                            <div className="absolute top-4 left-4 z-20">
                              <span className="bg-rose-600 text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-sm">
                                {product.discountPercent}% Savings
                              </span>
                            </div>

                            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                              <button
                                onClick={(e) => toggleWishlist(e, product.id)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
                                  wishlistState[product.id] ? 'bg-rose-600 text-white' : 'bg-white/90 text-[#2A2623] hover:bg-white'
                                }`}
                              >
                                <Heart size={16} className={wishlistState[product.id] ? 'fill-current' : ''} />
                              </button>
                              <Link to={`/product/${product.id}`} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#2A2623] hover:bg-white shadow-md">
                                <Eye size={16} />
                              </Link>
                            </div>
                          </div>

                          {/* Content Block */}
                          <div className="p-6 space-y-5">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                                  {product.segment?.replace('_', ' ')}
                                </span>
                                <h3 className="font-serif text-lg text-[#2A2623] italic leading-tight line-clamp-1 group-hover:text-rose-700 transition-colors">
                                  {product.title}
                                </h3>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-lg font-bold text-rose-600">
                                  {formatPrice(product.finalPriceCents)}
                                </p>
                                <p className="text-[10px] text-neutral-400 line-through tabular-nums">
                                  {formatPrice(product.basePriceCents)}
                                </p>
                              </div>
                            </div>

                            <button 
                              onClick={(e) => handleAddToCart(e, product)}
                              className="w-full h-12 bg-[#2A2623] text-white text-[10px] font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-3 hover:bg-rose-700 transition-all active:scale-[0.98] shadow-sm"
                            >
                              <ShoppingBag size={14} />
                              Acquire Design
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-24 pt-12 border-t border-neutral-100 flex items-center justify-center gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0); }}
                          disabled={page === 0}
                          className="rounded-none hover:bg-transparent text-neutral-400 hover:text-rose-600"
                        >
                          <ChevronLeft size={20} />
                        </Button>

                        <div className="flex items-center gap-3">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => { setPage(i); window.scrollTo(0, 0); }}
                              className={`w-8 h-8 text-[11px] font-bold transition-all border-b-2 tabular-nums ${
                                page === i 
                                ? 'border-rose-600 text-rose-600' 
                                : 'border-transparent text-neutral-300 hover:text-neutral-600'
                              }`}
                            >
                              {(i + 1).toString().padStart(2, '0')}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0); }}
                          disabled={page === totalPages - 1}
                          className="p-2 text-neutral-400 hover:text-rose-600 disabled:opacity-10"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SpecialOffers;