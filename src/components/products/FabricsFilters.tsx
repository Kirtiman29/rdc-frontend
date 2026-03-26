import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils'; // Assuming standard shadcn utility

interface Props {
  filters: any; // Replace with your specific ProductFilter type
  onFiltersChange: (filters: any) => void;
}

const segments = [
  { value: 'MENSWEAR', label: 'Menswear' },
  { value: 'WOMENSWEAR', label: 'Womenswear' },
  { value: 'KIDSWEAR', label: 'Kidswear' },
  { value: 'HOME_INTERIOR', label: 'Home Interior' },
];

const colors = [
  { name: 'Black', hex: '#000000' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Gray', hex: '#808080' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Green', hex: '#2E8B57' },
  { name: 'Blue', hex: '#1E90FF' },
  { name: 'Purple', hex: '#8A2BE2' },
  { name: 'Pink', hex: '#FF69B4' },
  { name: 'Red', hex: '#DC143C' },
  { name: 'Orange', hex: '#FF8C00' },
];

const styles = ['Modern', 'Traditional', 'Abstract', 'Artistic'];

export default function FabricsFilters({ filters, onFiltersChange }: Props) {
  
  const handleUpdate = (updates: Partial<any>) => {
    onFiltersChange({
      ...filters,
      ...updates,
      page: 0, // Reset pagination on any filter change
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: filters.sortBy || 'createdAt,desc',
      page: 0,
    });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, v]) => 
      !['sortBy', 'page'].includes(key) && 
      v !== undefined && 
      v !== null && 
      v !== ''
  );

  return (
    <div className="space-y-10 py-2">
      {/* 🔹 CLEAR FILTERS */}
      {hasActiveFilters && (
        <div className="pb-2 border-b border-neutral-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto p-0 text-[#BA1B1C] hover:text-[#921415] hover:bg-transparent font-medium flex items-center gap-1.5 transition-colors"
          >
            <X size={14} />
            <span className="text-xs uppercase tracking-tight">Clear all filters</span>
          </Button>
        </div>
      )}

      {/* 🔹 MARKET SEGMENT */}
      <section>
        <h4 className="mb-5 font-serif text-[11px] font-semibold uppercase tracking-[0.15em] text-[#2A2623]">
          Market Segment
        </h4>
        <div className="space-y-3.5">
          {segments.map((seg) => (
            <div key={seg.value} className="flex items-center space-x-3 group cursor-pointer">
              <Checkbox
                id={`seg-${seg.value}`}
                className="border-neutral-300 data-[state=checked]:bg-[#2A2623] data-[state=checked]:border-[#2A2623]"
                checked={filters.segment === seg.value}
                onCheckedChange={(checked) => 
                  handleUpdate({ segment: checked ? seg.value : undefined })
                }
              />
              <Label
                htmlFor={`seg-${seg.value}`}
                className="text-sm font-normal text-neutral-600 group-hover:text-black cursor-pointer transition-colors leading-none"
              >
                {seg.label}
              </Label>
            </div>
          ))}
        </div>
      </section>

      {/* 🔹 COLORS */}
      <section>
        <h4 className="mb-5 font-serif text-[11px] font-semibold uppercase tracking-[0.15em] text-[#2A2623]">
          Colors
        </h4>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => {
            const isActive = filters.color === c.name;
            return (
              <button
                key={c.name}
                title={c.name}
                onClick={() => handleUpdate({ color: isActive ? undefined : c.name })}
                className={cn(
                  "relative w-7 h-7 rounded-full border border-neutral-200 transition-all duration-200 hover:scale-110 flex-shrink-0",
                  isActive ? "ring-2 ring-offset-2 ring-[#2A2623] scale-110" : ""
                )}
                style={{ backgroundColor: c.hex }}
              >
                {c.name === 'White' && <div className="absolute inset-0 rounded-full border border-black/5" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 🔹 STYLE */}
      <section>
        <h4 className="mb-5 font-serif text-[11px] font-semibold uppercase tracking-[0.15em] text-[#2A2623]">
          Style
        </h4>
        <div className="flex flex-col space-y-2.5">
          {styles.map((style) => {
            const isActive = filters.style === style;
            return (
              <button
                key={style}
                onClick={() => handleUpdate({ style: isActive ? undefined : style })}
                className={cn(
                  "text-left text-sm transition-all duration-200 py-0.5",
                  isActive 
                    ? "text-[#2A2623] font-semibold translate-x-1" 
                    : "text-neutral-500 hover:text-black hover:translate-x-1"
                )}
              >
                {style}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}