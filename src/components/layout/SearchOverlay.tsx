import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Design[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ✅ Search Logic: Matches Title, Tags, and Segments via Backend
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const lowerQuery = query.trim().toLowerCase();

        /**
         * ✅ PRODUCTION SYNC:
         * getDesigns returns the unwrapped data object via interceptor.
         */
        const response: any = await getDesigns({ 
          search: lowerQuery, 
          size: 10 
        });
        
        const content = response?.content || (Array.isArray(response) ? response : []);
        
        // Sort newest first (highest ID) for relevance
        setResults([...content].sort((a, b) => b.id - a.id));
        
      } catch (error) {
        console.error('Search Error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(searchTimer);
  }, [query]);

  // Body Scroll Lock & ESC Key Listener
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
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close search"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="max-w-2xl mx-auto pt-20">
          <div className="relative">
            {loading ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search designs, categories, collections..."
              className="w-full h-14 pl-12 pr-4 bg-secondary/50 border border-border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {results.length > 0 && (
            <div className="mt-8 space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Found {results.length} results
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
                    <div className="w-16 h-16 rounded-sm overflow-hidden flex-shrink-0 bg-secondary border border-border/50">
                      <img
                        src={getAssetUrl(product.assetUuid)}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {product.title}
                      </h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {product.segment?.toLowerCase().replace('_', ' ') || 'Collection'}
                      </p>
                    </div>
                    <span className="font-serif text-lg text-foreground">
                      ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {query.trim().length >= 2 && results.length === 0 && !loading && (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground">No designs found for "<span className="text-foreground font-medium">{query}</span>"</p>
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="mt-12">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {['Menswear', 'Womenswear', 'Floral', 'Luxury', 'Special Offer'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 bg-secondary/50 rounded-full text-sm text-foreground hover:bg-secondary transition-all"
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