import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';
import { Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  href: string;
  tag?: string;
  category?: string;
}

interface MenuColumn {
  title: string;
  items: MenuItem[];
}

const menuColumns: MenuColumn[] = [
  {
    title: 'Apparel Segments',
    items: [
      { label: 'Menswear', href: '/gallery?segment=MENSWEAR', category: 'MENSWEAR' },
      { label: 'Womenswear', href: '/gallery?segment=WOMENSWEAR', category: 'WOMENSWEAR' },
      { label: 'Kidswear', href: '/gallery?segment=KIDSWEAR', category: 'KIDSWEAR' },
    ],
  },
  {
    title: 'Curated Collections',
    items: [
      { label: 'Trending Now', href: '/gallery?trending=true', tag: 'trending' },
      { label: 'New Arrivals', href: '/gallery?newArrival=true', tag: 'new-arrival' },
      { label: "Editor's Choice", href: '/gallery?editorsPick=true', tag: 'editors-choice' },
      { label: 'Limited Offers', href: '/gallery?specialOffer=true', tag: 'special-offer' },
    ],
  },
];

const MegaMenu = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [hoveredItem, setHoveredItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const res: any = await getDesigns({ size: 50 });
        const data = res?.content || (Array.isArray(res) ? res : []);
        setDesigns([...data].sort((a, b) => b.id - a.id));
      } catch (e) {
        console.error('MegaMenu sync failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  const getPreviewProduct = (): Design | null => {
    if (!designs.length) return null;
    if (!hoveredItem) return designs[0];

    let filtered = designs;
    if (hoveredItem.category) {
      filtered = designs.filter(d => d.segment === hoveredItem.category);
    } else if (hoveredItem.tag === 'trending') {
      filtered = designs.filter(d => d.trending);
    } else if (hoveredItem.tag === 'special-offer') {
      filtered = designs.filter(d => d.specialOffer);
    }
    return filtered[0] || designs[0];
  };

  const previewProduct = getPreviewProduct();

  return (
    <div className="fixed inset-x-0 top-[56px] md:top-[80px] z-[999] hidden lg:block outline-none">
      {/* Invisible Bridge: Ensures the menu doesn't close when moving mouse from Header to Menu */}
      <div className="absolute -top-10 left-0 right-0 h-10 bg-transparent" />

      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="container mx-auto px-12 py-12">
          <div className="grid grid-cols-12 gap-12">
            
            {/* 1. Brand Narrative Section */}
            <div className="col-span-3 space-y-6 border-r border-slate-100 pr-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Archive</span>
                <h2 className="text-2xl font-serif text-[#2A2623] mt-2">The Design Library</h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-light">
                Explore our meticulously curated repository of global textile patterns and modern apparel concepts.
              </p>
              <Link 
                to="/gallery" 
                className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2A2623] hover:opacity-70 transition-all"
              >
                View Catalog <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* 2. Navigation Links */}
            <div className="col-span-5 grid grid-cols-2 gap-4">
              {menuColumns.map((col) => (
                <div key={col.title} className="space-y-6">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    {col.title}
                  </h3>
                  <ul className="space-y-4">
                    {col.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          to={item.href}
                          onMouseEnter={() => setHoveredItem(item)}
                          className={cn(
                            "text-sm transition-all duration-300 flex items-center gap-0 hover:gap-2",
                            hoveredItem?.label === item.label 
                              ? "text-[#2A2623] font-bold translate-x-1" 
                              : "text-slate-500 font-medium"
                          )}
                        >
                          {hoveredItem?.label === item.label && <div className="h-1 w-1 rounded-full bg-black" />}
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* 3. Featured Preview Card */}
            <div className="col-span-4">
              <div className="relative group overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 p-2 shadow-sm transition-all hover:shadow-md">
                {loading ? (
                  <div className="h-[240px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-slate-300 h-6 w-6" />
                  </div>
                ) : previewProduct && (
                  <Link to={`/product/${previewProduct.id}`} className="block">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                      {/* Artistic Overlay */}
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
                      
                      <img
                        src={getAssetUrl(previewProduct.assetUuid)}
                        alt={previewProduct.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Price Tag Overlay */}
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full z-20 shadow-sm">
                        <p className="text-[11px] font-bold text-[#2A2623]">
                          ₹{(previewProduct.finalPriceCents / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Featured Design</p>
                      <h4 className="font-serif text-lg text-[#2A2623] group-hover:text-slate-600 transition-colors">
                        {previewProduct.title}
                      </h4>
                    </div>
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;