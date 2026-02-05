import { useEffect, useState } from 'react';
import { ProductFilter, Category } from '@/types/product';
import { X, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getCategories } from '@/api/designApi';
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

interface ProductFiltersProps {
  filters: ProductFilter;
  onFiltersChange: (filters: ProductFilter) => void;
  productCount: number;
}

const segments = [
  { value: 'MENSWEAR', label: 'Menswear' },
  { value: 'WOMENSWEAR', label: 'Womenswear' },
  { value: 'KIDSWEAR', label: 'Kidswear' },
  { value: 'HOME_INTERIOR', label: 'Home Interior' },
];

const sortOptions = [
  { value: 'createdAt,desc', label: 'Newest' },
  { value: 'finalPriceCents,asc', label: 'Price: Low to High' },
  { value: 'finalPriceCents,desc', label: 'Price: High to Low' },
  { value: 'title,asc', label: 'Alphabetical' },
];

const FilterContent = ({ filters, onFiltersChange }: Omit<ProductFiltersProps, 'productCount'>) => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setDbCategories(data);
      } catch (error) {
        console.error('Failed to sync filter categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ✅ FIX 1: Category now acts as a Tag Filter (Search)
  const handleCategoryChange = (tagName: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      search: checked ? tagName.toLowerCase() : undefined,
    });
  };

  const handleSegmentChange = (segment: string, checked: boolean) => {
    onFiltersChange({ ...filters, segment: checked ? segment : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({ sortBy: filters.sortBy });
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== false && v !== ''
  );

  return (
    <div className="space-y-8">
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters} 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="mr-2 h-4 w-4" />
          Clear all filters
        </Button>
      )}

      {/* Segments Section */}
      <div>
        <h4 className="mb-4 font-serif text-sm font-medium uppercase tracking-wider">Market Segment</h4>
        <div className="space-y-3">
          {segments.map((seg) => (
            <div key={seg.value} className="flex items-center space-x-3">
              <Checkbox
                id={`seg-${seg.value}`}
                checked={filters.segment === seg.value}
                onCheckedChange={(checked) => handleSegmentChange(seg.value, !!checked)}
              />
              <Label htmlFor={`seg-${seg.value}`} className="text-sm font-normal cursor-pointer uppercase">
                {seg.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Section (NOW TAG FILTERS) */}
      <div>
        <h4 className="mb-4 font-serif text-sm font-medium uppercase tracking-wider">Collections</h4>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-3">
            {dbCategories.map((cat) => (
              <div key={cat.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`cat-${cat.id}`}
                  // ✅ Matches search string to tag name
                  checked={filters.search === cat.name.toLowerCase()}
                  onCheckedChange={(checked) => handleCategoryChange(cat.name, !!checked)}
                />
                <Label htmlFor={`cat-${cat.id}`} className="text-sm font-normal cursor-pointer">
                  {cat.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attributes Section */}
      <div>
        <h4 className="mb-4 font-serif text-sm font-medium uppercase tracking-wider">Attributes</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="attr-premium"
              checked={!!filters.premium}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, premium: !!checked })}
            />
            <Label htmlFor="attr-premium" className="text-sm font-normal cursor-pointer">Premium Only</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="attr-trending"
              checked={!!filters.trending}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, trending: !!checked })}
            />
            <Label htmlFor="attr-trending" className="text-sm font-normal cursor-pointer">Trending</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductFilters = ({ filters, onFiltersChange, productCount }: ProductFiltersProps) => {
  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 lg:hidden">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-serif">Filter Designs</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
            </div>
          </SheetContent>
        </Sheet>

        <p className="text-sm text-muted-foreground font-medium">
          {productCount} {productCount === 1 ? 'Design' : 'Designs'} Found
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort:</span>
        <Select value={filters.sortBy || 'createdAt,desc'} onValueChange={handleSortChange}>
          <SelectTrigger className="w-48 bg-background">
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