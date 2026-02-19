import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  // ✅ Security: Restrict Right-Click across the entire hero area to protect brand assets
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <section 
      className="relative min-h-[90vh] overflow-hidden bg-secondary select-none"
      onContextMenu={handleContextMenu}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container relative flex min-h-[90vh] items-center px-4 mx-auto">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-20">
          {/* Text content */}
          <div className="flex flex-col justify-center relative z-20">
            <span className="mb-4 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Premium Collection
            </span>
            <h1 className="mb-6 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-6xl xl:text-7xl text-[#2A2623]">
              Artistry Woven
              <br />
              <span className="text-champagne">Into Every Thread</span>
            </h1>
            <p className="mb-8 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              Discover our curated collection of exceptional textile designs. From digital 
              patterns to luxurious fabrics, each piece tells a story of craftsmanship 
              and timeless elegance.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="group px-8 bg-[#2A2623] hover:bg-black uppercase text-xs font-bold tracking-widest rounded-none h-14">
                <Link to="/gallery">
                  Explore Collection
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 border-[#2A2623] text-[#2A2623] uppercase text-xs font-bold tracking-widest rounded-none h-14 hover:bg-[#2A2623] hover:text-white transition-all">
                {/* ✅ SYNC: Direct mapping to the HOME_INTERIOR segment in Admin Service */}
                <Link to="/gallery?segment=HOME_INTERIOR">Custom Services</Link>
              </Button>
            </div>
          </div>

          {/* Hero image grid with Industrial Watermarks */}
          <div className="relative hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative aspect-[3/4] animate-fade-in overflow-hidden rounded-sm group shadow-2xl">
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-[0.25]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='14' font-weight='900' fill='none' stroke='white' stroke-width='0.5' text-anchor='middle' transform='rotate(-35 50 50)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                    alt="Textile pattern detail"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="relative aspect-square animate-fade-in overflow-hidden rounded-sm [animation-delay:200ms] group shadow-xl">
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-[0.25]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='12' font-weight='900' fill='none' stroke='white' stroke-width='0.5' text-anchor='middle' transform='rotate(-35 40 40)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  <img
                    src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80"
                    alt="Premium fabric"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="relative aspect-square animate-fade-in overflow-hidden rounded-sm [animation-delay:100ms] group shadow-xl">
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-[0.25]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='12' font-weight='900' fill='none' stroke='white' stroke-width='0.5' text-anchor='middle' transform='rotate(-35 40 40)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  <img
                    src="https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80"
                    alt="Velvet texture"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="relative aspect-[3/4] animate-fade-in overflow-hidden rounded-sm [animation-delay:300ms] group shadow-2xl">
                   <div 
                    className="absolute inset-0 z-10 pointer-events-none opacity-[0.25]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='14' font-weight='900' fill='none' stroke='white' stroke-width='0.5' text-anchor='middle' transform='rotate(-35 50 50)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat'
                    }}
                  />
                  <img
                    src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80"
                    alt="Artisan pillows"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce md:block">
        <div className="h-12 w-6 rounded-full border-2 border-[#2A2623]/20 p-1">
          <div className="mx-auto h-2 w-1 rounded-full bg-[#2A2623]/40" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;