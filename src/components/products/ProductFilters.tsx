import { ProductFilter } from '@/types/product';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  filters: ProductFilter;
  onFiltersChange: (filters: ProductFilter) => void;
  productCount: number;
}

const categories = [
  { value: 'digital', label: 'Digital Patterns' },
  { value: 'fabric', label: 'Premium Fabrics' },
  { value: 'custom', label: 'Custom Services' },
  { value: 'ready-made', label: 'Ready-Made' },
];

const priceRanges = [
  { value: '0-50', label: 'Under $50', range: [0, 50] as [number, number] },
  { value: '50-100', label: '$50 - $100', range: [50, 100] as [number, number] },
  { value: '100-250', label: '$100 - $250', range: [100, 250] as [number, number] },
  { value: '250+', label: '$250+', range: [250, 10000] as [number, number] },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Alphabetical' },
];

const FilterContent = ({ filters, onFiltersChange }: Omit<ProductFiltersProps, 'productCount'>) => {
  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = filters.category || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter((c) => c !== category);
    onFiltersChange({ ...filters, category: newCategories.length > 0 ? newCategories : undefined });
  };

  const handlePriceChange = (rangeValue: string | undefined) => {
    if (!rangeValue) {
      onFiltersChange({ ...filters, priceRange: undefined });
      return;
    }
    const priceRange = priceRanges.find((p) => p.value === rangeValue);
    onFiltersChange({ ...filters, priceRange: priceRange?.range });
  };

  const handleInStockChange = (checked: boolean) => {
    onFiltersChange({ ...filters, inStock: checked || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({ sortBy: filters.sortBy });
  };

  const hasActiveFilters = filters.category?.length || filters.priceRange || filters.inStock;

  return (
    <div className="space-y-6">
      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full justify-start">
          <X className="mr-2 h-4 w-4" />
          Clear all filters
        </Button>
      )}

      {/* Categories */}
      <div>
        <h4 className="mb-4 font-serif text-sm font-medium uppercase tracking-wider">
          Category
        </h4>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.value} className="flex items-center space-x-3">
              <Checkbox
                id={`category-${category.value}`}
                checked={filters.category?.includes(category.value) || false}
                onCheckedChange={(checked) =>
                  handleCategoryChange(category.value, checked as boolean)
                }
              />
              <Label
                htmlFor={`category-${category.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="mb-4 font-serif text-sm font-medium uppercase tracking-wider">
          Price Range
        </h4>
        <div className="space-y-3">
          {priceRanges.map((range) => {
            const isSelected =
              filters.priceRange?.[0] === range.range[0] &&
              filters.priceRange?.[1] === range.range[1];
            return (
              <div key={range.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`price-${range.value}`}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handlePriceChange(checked ? range.value : undefined)
                  }
                />
                <Label
                  htmlFor={`price-${range.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {range.label}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h4 className="mb-4 font-serif text-sm font-medium uppercase tracking-wider">
          Availability
        </h4>
        <div className="flex items-center space-x-3">
          <Checkbox
            id="in-stock"
            checked={filters.inStock || false}
            onCheckedChange={(checked) => handleInStockChange(checked as boolean)}
          />
          <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
            In Stock Only
          </Label>
        </div>
      </div>
    </div>
  );
};

const ProductFilters = ({ filters, onFiltersChange, productCount }: ProductFiltersProps) => {
  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sortBy: value as ProductFilter['sortBy'],
    });
  };

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Mobile filter button */}
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 lg:hidden">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-serif">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
            </div>
          </SheetContent>
        </Sheet>

        <p className="text-sm text-muted-foreground">
          {productCount} {productCount === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={filters.sortBy || 'newest'} onValueChange={handleSortChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export { ProductFilters, FilterContent };
