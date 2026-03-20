import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, Loader2, ChevronLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import { ProductFilters, FilterContent } from '@/components/products/ProductFilters';
import { getDesigns } from '@/api/designApi';
import type { Design, ProductFilter } from '@/types/product';
import { Button } from '@/components/ui/button';

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  
  // ✅ Pagination State
  const [page, setPage] = useState(Number(searchParams.get('page')) || 0);
  const PAGE_SIZE = 24;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

const [filters, setFilters] = useState<ProductFilter>({
  categoryId: searchParams.get('category')
    ? Number(searchParams.get('category'))
    : undefined,

  segment: searchParams.get('segment') || undefined,
  luxury: searchParams.get('luxury') === 'true',
  trending: searchParams.get('trending') === 'true',
  specialOffer: searchParams.get('specialOffer') === 'true',
  sortBy: searchParams.get('sortBy') || 'createdAt,desc',
});

  const fetchFilteredDesigns = useCallback(async () => {
    setLoading(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, v]) => v !== undefined && v !== false && v !== ''
        )
      );

      // ✅ Updated for Spring Boot Pageable (page, size)
      const response: any = await getDesigns({
        ...cleanedFilters,
        page: page,
        size: PAGE_SIZE, 
      });

      // Handle response safely - Spring Boot usually returns content in .content
      const rawContent = response?.content || (Array.isArray(response) ? response : []);
      
      // ✅ 1. SORTING FIX: Ensure newest designs are at the top (highest ID first)
      const sortedContent = [...rawContent].sort((a, b) => b.id - a.id);

      // ✅ 2. PAGINATION FIX: Read totalElements from backend to calculate correct totalPages
      const total = response?.totalElements || sortedContent.length;
      
      setDesigns(sortedContent);
      setTotalElements(total);
    } catch (error) {
      console.error('Gallery sync error:', error);
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchFilteredDesigns();

    const newParams: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
  if (value !== undefined && value !== false && value !== '') {

    if (key === "categoryId") {
      newParams["category"] = String(value);
    } else {
      newParams[key] = String(value);
    }

  }
});
    // Sync page with URL
    if (page > 0) newParams.page = String(page);
    
    setSearchParams(newParams, { replace: true });
  }, [filters, page, fetchFilteredDesigns, setSearchParams]);

  // ✅ Reset page to 0 when filters change
  const handleFilterChange = (newFilters: ProductFilter) => {
    setFilters(newFilters);
    setPage(0); 
  };

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  return (
    <div className="flex min-h-screen flex-col bg-background" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1">
        <section className="bg-secondary/30 py-12 md:py-16">
          <div className="container px-4 mx-auto md:px-8">
            <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <Link to="/" className="transition-colors hover:text-[#2A2623]">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[#2A2623] font-bold">Collection Gallery</span>
            </nav>

            <h1 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl text-[#2A2623] tracking-tight">
              {filters.segment
                ? (typeof filters.segment === 'string'
                    ? filters.segment.replace('_', ' ')
                    : filters.segment[0].replace('_', ' '))
                : 'All Industrial Designs'}
            </h1>
            <p className="mt-2 text-muted-foreground text-sm max-w-xl">
              Browsing {totalElements} authenticated textile patterns. Page {page + 1} of {totalPages || 1}.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 mx-auto md:px-8">
            <div className="flex flex-col gap-8 lg:flex-row">
              
              <aside className="hidden w-64 shrink-0 lg:block max-h-[calc(100vh-160px)] sticky top-32 overflow-y-auto pr-2 custom-scrollbar">
                <h2 className="mb-6 font-serif text-lg font-bold text-[#2A2623] uppercase tracking-widest border-b border-border pb-2">Refine By</h2>
                <FilterContent filters={filters} onFiltersChange={handleFilterChange} />
              </aside>

              <div className="flex-1">
                <ProductFilters
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  productCount={totalElements}
                />

                {loading ? (
                  <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#2A2623]" />
                  </div>
                ) : designs.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-10">
                      {designs.map((design) => (
                        <div key={design.id} className="relative group overflow-hidden select-none w-full">
                          <div 
                            className="absolute inset-0 z-10 pointer-events-none opacity-[0.20]"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='18' font-weight='900' fill='none' stroke='white' stroke-width='0.7' text-anchor='middle' transform='rotate(-35 50 50)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                              backgroundRepeat: 'repeat'
                            }}
                          />
                          <ProductCard product={design} />
                        </div>
                      ))}
                    </div>

                    {/* ✅ PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                      <div className="mt-16 flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0); }}
                          disabled={page === 0}
                          className="rounded-none"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1 mx-4">
                          {[...Array(totalPages)].map((_, i) => (
                            <Button
                              key={i}
                              variant={page === i ? "default" : "ghost"}
                              className={`w-10 h-10 rounded-none ${page === i ? 'bg-[#2A2623] text-white' : ''}`}
                              onClick={() => { setPage(i); window.scrollTo(0, 0); }}
                            >
                              {i + 1}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0); }}
                          disabled={page === totalPages - 1}
                          className="rounded-none"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-24 text-center border rounded-xl border-dashed border-slate-300 bg-secondary/10">
                    <p className="font-serif text-xl text-slate-500 font-medium">
                      No matching industrial patterns found.
                    </p>
                    <button
                      onClick={() => handleFilterChange({ sortBy: 'createdAt,desc' })}
                      className="mt-6 px-6 py-2 bg-[#2A2623] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-black transition-all"
                    >
                      Reset all filters
                    </button>
                  </div>
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

export default Gallery;