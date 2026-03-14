import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';
import { Loader2 } from 'lucide-react';

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
    title: 'Apparel',
    items: [
      { label: 'Menswear', href: '/gallery?segment=MENSWEAR', category: 'MENSWEAR' },
      { label: 'Womenswear', href: '/gallery?segment=WOMENSWEAR', category: 'WOMENSWEAR' },
      { label: 'Kidswear', href: '/gallery?segment=KIDSWEAR', category: 'KIDSWEAR' },
    ],
  },
  {
    title: 'Collections',
    items: [
      { label: 'Trending', href: '/gallery?trending=true', tag: 'trending' },
      { label: 'New Arrivals', href: '/gallery?newArrival=true', tag: 'new-arrival' },
      { label: "Editor's Choice", href: '/gallery?editorsPick=true', tag: 'editors-choice' },
      { label: 'Special Offers', href: '/gallery?specialOffer=true', tag: 'special-offer' },
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
        /**
         * ✅ PRODUCTION SYNC:
         * getDesigns returns data directly via the interceptor.
         */
        const res: any = await getDesigns({ size: 100 });
        
        // Safety check for Spring Boot content format vs raw array
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
    <div className="fixed inset-x-0 top-[64px] md:top-[80px] z-[100] hidden lg:block">
      
      {/* ✅ INVISIBLE HOVER BUFFER: Keeps menu open while mouse travels from header */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-transparent" />

      <div className="bg-white border-b border-slate-200 shadow-2xl animate-in slide-in-from-top-2 duration-300">
        <div className="container mx-auto px-8 md:px-12 py-10">
          <div className="grid grid-cols-12 gap-10">

            {/* Left Brand Column */}
            <div className="col-span-2 border-r border-slate-100 pr-6">
              <Link
                to="/gallery"
                className="inline-block text-[11px] font-black uppercase tracking-[0.25em] text-[#2A2623] border-b-2 border-[#2A2623]"
              >
                The Archive
              </Link>
              <p className="mt-6 text-[10px] text-slate-400 uppercase tracking-wider leading-relaxed">
                Explore RDC’s global textile repository.
              </p>
            </div>

            {/* Center Navigation Columns */}
            <div className="col-span-6 grid grid-cols-2 gap-8">
              {menuColumns.map(col => (
                <div key={col.title}>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-300 mb-6 font-bold">
                    {col.title}
                  </h3>
                  <ul className="space-y-4">
                    {col.items.map(item => (
                      <li key={item.label}>
                        <Link
                          to={item.href}
                          className="text-[13px] font-bold text-[#2A2623] hover:text-slate-500 transition-colors"
                          onMouseEnter={() => setHoveredItem(item)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Right Product Preview Card */}
            <div className="col-span-4">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-inner">
                {loading ? (
                  <div className="h-[280px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-slate-300 h-8 w-8" />
                  </div>
                ) : previewProduct && (
                  <Link to={`/product/${previewProduct.id}`} className="block group">
                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-4 shadow-sm">
                      {/* Industrial Watermark Overlay */}
                      <div 
                        className="absolute inset-0 z-10 pointer-events-none opacity-[0.15]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='12' font-weight='900' fill='none' stroke='black' stroke-width='0.4' text-anchor='middle' transform='rotate(-35 40 40)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                          backgroundRepeat: 'repeat'
                        }}
                      />
                      <img
                        src={getAssetUrl(previewProduct.assetUuid)}
                        alt={previewProduct.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    </div>
                    <h4 className="font-serif text-lg truncate text-[#2A2623]">
                      {previewProduct.title}
                    </h4>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      ₹{(previewProduct.finalPriceCents / 100).toLocaleString('en-IN')}
                    </p>
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