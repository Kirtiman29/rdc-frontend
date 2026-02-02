import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import { ProductFilters, FilterContent } from '@/components/products/ProductFilters';
import { getDesigns } from '@/api/designApi';
import type { Design, ProductFilter } from '@/types/product';

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  // ✅ Security: Global Gallery right-click restriction
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const [filters, setFilters] = useState<ProductFilter>({
    category: searchParams.get('category') ? Number(searchParams.get('category')) : undefined,
    segment: searchParams.get('segment') || undefined,
    premium: searchParams.get('premium') === 'true',
    trending: searchParams.get('trending') === 'true',
    specialOffer: searchParams.get('specialOffer') === 'true',
    sortBy: searchParams.get('sortBy') || 'createdAt,desc',
  });

  const fetchFilteredDesigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDesigns({
        ...filters,
        limit: 24, // Increased limit to ensure better grid filling
      });

      const rawContent = Array.isArray(response) ? response : (response.content || []);
      
      // ✅ SORT: Ensure newest entries (highest IDs) are shown first
      const sortedContent = [...rawContent].sort((a, b) => b.id - a.id);

      const total = Array.isArray(response) ? response.length : (response.totalElements || sortedContent.length);
      
      setDesigns(sortedContent);
      setTotalElements(total);
    } catch (error) {
      console.error('Gallery sync error:', error);
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilteredDesigns();

    const newParams: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== false && value !== '') {
        newParams[key] = String(value);
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [filters, fetchFilteredDesigns, setSearchParams]);

  return (
    <div className="flex min-h-screen flex-col bg-background" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1">
        {/* Banner Section */}
        <section className="bg-secondary/30 py-12 md:py-16">
          <div className="container px-4 mx-auto md:px-8">
            <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <Link to="/" className="transition-colors hover:text-[#2A2623]">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[#2A2623] font-bold">Collection Gallery</span>
            </nav>

            <h1 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl text-[#2A2623] tracking-tight">
              {filters.segment ? filters.segment.replace('_', ' ') : 'All Industrial Designs'}
            </h1>
            <p className="mt-2 text-muted-foreground text-sm max-w-xl">
              Browsing {totalElements} authenticated textile patterns from the RDC archive.
            </p>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="py-12 md:py-16">
          <div className="container px-4 mx-auto md:px-8">
            <div className="flex flex-col gap-12 lg:flex-row">
              
              {/* Desktop Filters */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <h2 className="mb-6 font-serif text-lg font-bold text-[#2A2623] uppercase tracking-widest border-b border-border pb-2">Refine By</h2>
                <FilterContent filters={filters} onFiltersChange={setFilters} />
              </aside>

              {/* Grid Content */}
              <div className="flex-1">
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  productCount={totalElements}
                />

                {loading ? (
                  <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#2A2623]" />
                  </div>
                ) : designs.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {designs.map((design) => (
                      <div key={design.id} className="relative group overflow-hidden select-none">
                        {/* ✅ HIGH-VISIBILITY WATERMARK FOR GALLERY CARDS */}
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
                ) : (
                  <div className="py-24 text-center border rounded-xl border-dashed border-slate-300 bg-secondary/10">
                    <p className="font-serif text-xl text-slate-500 font-medium">
                      No matching industrial patterns found.
                    </p>
                    <button
                      onClick={() => setFilters({ sortBy: 'createdAt,desc' })}
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