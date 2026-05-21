import { useEffect, useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Category, ProductFilter } from "@/types/product";
import { getFabricCategories } from "@/api/fabricApi";

interface Props {
  filters: ProductFilter;
  onFiltersChange: (filters: ProductFilter) => void;
}

export default function FabricsFilters({ filters, onFiltersChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await getFabricCategories();
        if (isMounted) {
          setCategories(response);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdate = (updates: Partial<ProductFilter>) => {
    onFiltersChange({
      ...filters,
      ...updates,
      page: 0,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: filters.sortBy || "createdAt,desc",
      page: 0,
    });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      !["sortBy", "page"].includes(key) &&
      value !== undefined &&
      value !== null &&
      value !== false &&
      value !== ""
  );

  return (
    <div className="space-y-10 py-2">
      {hasActiveFilters && (
        <div className="border-b border-neutral-200 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto p-0 font-medium text-[#BA1B1C] transition-colors hover:bg-transparent hover:text-[#921415]"
          >
            <X size={14} />
            <span className="ml-1.5 text-xs uppercase tracking-tight">Clear all filters</span>
          </Button>
        </div>
      )}

      <section>
        <h4 className="mb-5 font-serif text-[11px] font-semibold uppercase tracking-[0.15em] text-[#2A2623]">
          Fabric Categories
        </h4>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading fabric categories...</p>
        ) : categories.length > 0 ? (
          <div className="space-y-3.5">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`fabric-category-${category.id}`}
                  className="border-neutral-300 data-[state=checked]:border-[#2A2623] data-[state=checked]:bg-[#2A2623]"
                  checked={filters.categoryId === category.id}
                  onCheckedChange={(checked) =>
                    handleUpdate({ categoryId: checked ? category.id : undefined })
                  }
                />
                <Label
                  htmlFor={`fabric-category-${category.id}`}
                  className="cursor-pointer text-sm font-normal text-neutral-600 transition-colors hover:text-black"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No public fabric categories are available.</p>
        )}
      </section>

      <section>
        <h4 className="mb-5 font-serif text-[11px] font-semibold uppercase tracking-[0.15em] text-[#2A2623]">
          Offers
        </h4>
        <div className="flex items-center space-x-3">
          <Checkbox
            id="fabric-special-offer"
            className="border-neutral-300 data-[state=checked]:border-[#2A2623] data-[state=checked]:bg-[#2A2623]"
            checked={!!filters.specialOffer}
            onCheckedChange={(checked) => handleUpdate({ specialOffer: !!checked || undefined })}
          />
          <Label
            htmlFor="fabric-special-offer"
            className="flex cursor-pointer items-center gap-2 text-sm font-normal text-neutral-600 transition-colors hover:text-black"
          >
            <Tag size={14} />
            Special offers only
          </Label>
        </div>
      </section>
    </div>
  );
}
