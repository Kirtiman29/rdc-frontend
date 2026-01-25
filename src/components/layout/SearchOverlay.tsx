import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { products } from '@/data/products';
import { Product } from '@/types/product';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered.slice(0, 6));
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="container mx-auto px-4 md:px-8 pt-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close search"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Search Input */}
        <div className="max-w-2xl mx-auto pt-20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search designs, categories, collections..."
              className="w-full h-14 pl-12 pr-4 bg-secondary/50 border border-border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-8 space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                Results
              </p>
              <div className="space-y-2">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={() => {
                      onClose();
                      setQuery('');
                    }}
                    className="flex items-center gap-4 p-3 rounded-sm hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="w-16 h-16 rounded-sm overflow-hidden flex-shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground group-hover:text-muted-foreground transition-colors truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {product.tags[0]}
                      </p>
                    </div>
                    <span className="font-serif text-lg text-foreground">
                      ${product.price}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {query.length >= 2 && results.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">No designs found for "{query}"</p>
            </div>
          )}

          {/* Quick Links */}
          {query.length < 2 && (
            <div className="mt-12">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {['Floral', 'Geometric', 'Premium', 'Trending', 'New Arrivals'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term.toLowerCase())}
                    className="px-4 py-2 bg-secondary/50 rounded-full text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
