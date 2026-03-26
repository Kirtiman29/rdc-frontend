import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronLeft, Loader2, SlidersHorizontal } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import FabricsFilters from "@/components/products/FabricsFilters";
import { getDesigns } from "@/api/designApi";
import type { Design, ProductFilter } from "@/types/product";
import { Button } from "@/components/ui/button";

const Fabrics = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  // Sync initial state from URL
  const [page, setPage] = useState(Number(searchParams.get("page")) || 0);
  const PAGE_SIZE = 24;

  const [filters, setFilters] = useState<ProductFilter>({
    segment: searchParams.get("segment") || undefined,
    color: searchParams.get("color") || undefined,
    style: searchParams.get("style") || undefined,
    sortBy: searchParams.get("sortBy") || "createdAt,desc",
  });

  const fetchFabrics = useCallback(async () => {
    setLoading(true);
    try {
      // mapping our state to the API request
      const response: any = await getDesigns({
        ...filters,
        page,
        size: PAGE_SIZE,
      });

      const content = response?.content || [];
      const total = response?.totalElements || 0;

      setDesigns(content);
      setTotalElements(total);
    } catch (err) {
      console.error(err);
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Handle Fetching and URL Syncing
  useEffect(() => {
    fetchFabrics();

    const params: any = {};
    if (page > 0) params.page = page.toString();
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.segment) params.segment = filters.segment;
    if (filters.color) params.color = filters.color;
    if (filters.style) params.style = filters.style;

    setSearchParams(params);
  }, [filters, page, setSearchParams, fetchFabrics]);

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F0]">
      <Header />

      <main className="flex-1">
        {/* --- HEADER SECTION --- */}
        <section className="pt-16 pb-10 border-b border-neutral-200 bg-white/50">
          <div className="container mx-auto px-4 md:px-8">
            <h1 className="font-serif text-4xl md:text-5xl text-[#2A2623] mb-2">
              All Fabrics
            </h1>
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-widest">
              {totalElements.toLocaleString()} Designs Found
            </p>
          </div>
        </section>

        {/* --- MAIN CONTENT --- */}
        <section className="py-12">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row gap-12">
              
              {/* --- SIDEBAR (Desktop) --- */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <FabricsFilters 
                    filters={filters} 
                    onFiltersChange={(newFilters) => {
                      setFilters(newFilters);
                      setPage(0); // Always reset to first page on filter change
                    }} 
                  />
                </div>
              </aside>

              {/* --- PRODUCT AREA --- */}
              <div className="flex-1">
                
                {/* Top Control Bar */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-neutral-100">
                  <button className="lg:hidden flex items-center gap-2 text-sm font-semibold border px-4 py-2 rounded-md bg-white">
                    <SlidersHorizontal size={16} />
                    Filters
                  </button>

                  <div className="flex items-center gap-4 ml-auto">
                    <span className="text-xs text-neutral-400 uppercase font-bold tracking-tight">Sort By:</span>
                    <select 
                      className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                      value={filters.sortBy}
                      onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    >
                      <option value="createdAt,desc">Newest</option>
                      <option value="price,asc">Price: Low to High</option>
                      <option value="price,desc">Price: High to Low</option>
                      <option value="popularity,desc">Best Selling</option>
                    </select>
                  </div>
                </div>

                {/* Grid Logic */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="animate-spin w-10 h-10 text-neutral-300" />
                    <p className="text-sm text-neutral-400 font-medium">Loading premium fabrics...</p>
                  </div>
                ) : designs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {designs.map((d) => (
                      <ProductCard key={d.id} product={d} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-32 bg-white/30 rounded-xl border border-dashed border-neutral-200">
                    <p className="text-neutral-500 font-serif text-xl">No designs found matching these filters.</p>
                    <Button 
                      variant="link" 
                      onClick={() => setFilters({ sortBy: "createdAt,desc" })}
                      className="mt-2 text-[#BA1B1C]"
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-20 gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full w-10 h-10"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft size={18} />
                    </Button>

                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-[#2A2623]">{page + 1}</span>
                      <span className="text-neutral-400">of</span>
                      <span className="text-neutral-400">{totalPages}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full w-10 h-10"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page === totalPages - 1}
                    >
                      <ChevronRight size={18} />
                    </Button>
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

export default Fabrics;