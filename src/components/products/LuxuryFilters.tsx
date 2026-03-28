import { useEffect, useState } from 'react';
import { ProductFilter, Category } from '@/types/product';
import { X, Filter } from 'lucide-react';
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

interface LuxuryFiltersProps {
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
  { value: 'createdAt,desc', label: 'Latest Arrivals' },
  { value: 'finalPriceCents,asc', label: 'Price: Low to High' },
  { value: 'finalPriceCents,desc', label: 'Price: High to Low' },
  { value: 'title,asc', label: 'Alphabetical' },
];

const LuxuryFilterContent = ({ filters, onFiltersChange }: Omit<LuxuryFiltersProps, 'productCount'>) => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setDbCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to sync luxury categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleFilterToggle = (key: keyof ProductFilter, value: any, isChecked: boolean) => {
    onFiltersChange({
      ...filters,
      [key]: isChecked ? value : undefined,
      page: 0,
    });
  };

  const clearFilters = () => {
    onFiltersChange({ 
      sortBy: 'createdAt,desc',
      luxury: true, 
      page: 0,
      size: 24 // Match your initial state in Premium.tsx
    });
  };

  // ✅ FIXED: Included 'size' in the exclusion array
  const hasActiveFilters = Object.entries(filters).some(
    ([key, v]) => !['sortBy', 'page', 'luxury', 'size'].includes(key) && v !== undefined && v !== false && v !== ''
  );

  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <h4 className="mb-5 text-[10px] font-black uppercase tracking-[0.3em] text-[#c9a96e]/70 border-b border-white/5 pb-2">
      {children}
    </h4>
  );

  return (
    <div className="space-y-10">
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters} 
          className="w-full justify-start text-[#c9a96e] hover:text-white hover:bg-white/5 border border-[#c9a96e]/20"
        >
          <X className="mr-2 h-3 w-3" />
          <span className="text-[10px] uppercase tracking-widest font-bold">Reset Filters</span>
        </Button>
      )}

      {/* Market Segments */}
      <div>
        <SectionHeading>Market Segment</SectionHeading>
        <div className="space-y-4">
          {segments.map((seg) => (
            <div key={seg.value} className="flex items-center space-x-3 group">
              <Checkbox
                id={`seg-${seg.value}`}
                className="border-white/20 data-[state=checked]:bg-[#c9a96e] data-[state=checked]:border-[#c9a96e]"
                checked={filters.segment === seg.value}
                onCheckedChange={(checked) => handleFilterToggle('segment', seg.value, !!checked)}
              />
              <Label htmlFor={`seg-${seg.value}`} className="text-xs font-medium text-white/60 group-hover:text-[#c9a96e] cursor-pointer uppercase tracking-widest transition-colors">
                {seg.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Collections */}
      <div>
        <SectionHeading>Exclusive Collections</SectionHeading>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-4 w-full bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {dbCategories.map((cat) => (
              <div key={cat.id} className="flex items-center space-x-3 group">
                <Checkbox
                  id={`cat-${cat.id}`}
                  className="border-white/20 data-[state=checked]:bg-[#c9a96e] data-[state=checked]:border-[#c9a96e]"
                  checked={filters.categoryId === cat.id}
                  onCheckedChange={(checked) => handleFilterToggle('categoryId', cat.id, !!checked)}
                />
                <Label htmlFor={`cat-${cat.id}`} className="text-xs font-medium text-white/60 group-hover:text-[#c9a96e] cursor-pointer tracking-wide transition-colors">
                  {cat.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attributes */}
      <div>
        <SectionHeading>Registry Status</SectionHeading>
        <div className="space-y-4">
          {[
            { id: 'attr-trending', key: 'trending', label: 'Trending Now' },
            { id: 'attr-editors', key: 'editorsPick', label: "Editor's Choice" },
            { id: 'attr-new', key: 'newArrival', label: 'Recently Registered' },
          ].map((attr) => (
            <div key={attr.id} className="flex items-center space-x-3 group">
              <Checkbox
                id={attr.id}
                className="border-white/20 data-[state=checked]:bg-[#c9a96e] data-[state=checked]:border-[#c9a96e]"
                checked={!!filters[attr.key as keyof ProductFilter]}
                onCheckedChange={(checked) => handleFilterToggle(attr.key as keyof ProductFilter, true, !!checked)}
              />
              <Label htmlFor={attr.id} className="text-xs font-medium text-white/60 group-hover:text-[#c9a96e] cursor-pointer tracking-wide transition-colors">
                {attr.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LuxuryFilters = ({ filters, onFiltersChange, productCount }: LuxuryFiltersProps) => {
  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value, page: 0 });
  };

  return (
    <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-8">
      <div className="flex items-center gap-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:border-[#c9a96e]/50 gap-3 px-6 rounded-none">
              <Filter className="h-4 w-4 text-[#c9a96e]" /> 
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Refine Selection</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-[#1a1a1a] border-r border-white/10 text-white overflow-y-auto custom-scrollbar">
            <SheetHeader className="border-b border-white/5 pb-6 mb-8">
              <SheetTitle className="font-serif text-[#c9a96e] uppercase tracking-[0.2em] text-xl">Filters</SheetTitle>
            </SheetHeader>
            <LuxuryFilterContent filters={filters} onFiltersChange={onFiltersChange} />
          </SheetContent>
        </Sheet>

        <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
          <span className="text-[#c9a96e] mr-1">{productCount}</span> 
          {productCount === 1 ? 'Master Design' : 'Master Designs'}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Sort By:</span>
        <Select value={filters.sortBy || 'createdAt,desc'} onValueChange={handleSortChange}>
          <SelectTrigger className="w-56 bg-[#252525] border-white/5 text-white rounded-none focus:ring-[#c9a96e]/50 text-xs uppercase tracking-wider font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#252525] border-white/10 text-white rounded-none">
            {sortOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="text-xs uppercase tracking-widest focus:bg-[#c9a96e] focus:text-[#1a1a1a] cursor-pointer"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export { LuxuryFilters, LuxuryFilterContent };