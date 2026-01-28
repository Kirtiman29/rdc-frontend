// src/pages/Gallery.tsx

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
  
  // ✅ Technical Logic: Manage live designs and loading states
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  // Sync state with URL search parameters
  const [filters, setFilters] = useState<ProductFilter>({
    category: searchParams.get('category') ? Number(searchParams.get('category')) : undefined,
    segment: searchParams.get('segment') || undefined,
    premium: searchParams.get('premium') === 'true',
    trending: searchParams.get('trending') === 'true',
    specialOffer: searchParams.get('specialOffer') === 'true',
    sortBy: searchParams.get('sortBy') || 'createdAt,desc',
  });

  // ✅ Industrial Sync: Server-side fetching with Pageable support
  const fetchFilteredDesigns = useCallback(async () => {
    setLoading(true);
    try {
      // Hits Admin Service (Port 8080) with dynamic query params
      const response = await getDesigns({
        ...filters,
        limit: 12, // Default page size
      });

      // FIXED: Handle both Page object (response.content) and raw Array
      const content = Array.isArray(response) ? response : (response.content || []);
      const total = Array.isArray(response) ? response.length : (response.totalElements || content.length);
      
      setDesigns(content);
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

    // Sync URL with current filter state
    const newParams: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== false && value !== '') {
        newParams[key] = String(value);
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [filters, fetchFilteredDesigns, setSearchParams]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Banner Section */}
        <section className="bg-secondary/30 py-12 md:py-16">
          <div className="container px-4 mx-auto md:px-8">
            <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="transition-colors hover:text-foreground">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Collection Gallery</span>
            </nav>

            <h1 className="font-serif text-3xl font-medium md:text-4xl lg:text-5xl">
              {filters.segment ? filters.segment.replace('_', ' ') : 'All Designs'}
            </h1>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="py-12 md:py-16">
          <div className="container px-4 mx-auto md:px-8">
            <div className="flex flex-col gap-12 lg:flex-row">
              
              {/* Desktop Filters */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <h2 className="mb-6 font-serif text-lg font-medium">Refine By</h2>
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
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  </div>
                ) : designs.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {designs.map((design) => (
                      <ProductCard key={design.id} product={design} />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center border rounded-lg border-dashed bg-secondary/10">
                    <p className="font-serif text-xl text-muted-foreground">
                      No matching designs found in the database.
                    </p>
                    <button
                      onClick={() => setFilters({ sortBy: 'createdAt,desc' })}
                      className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-primary transition-colors"
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