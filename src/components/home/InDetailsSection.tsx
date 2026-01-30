import { Palette, Layers, Sparkles, Award } from 'lucide-react';

const details = [
  {
    icon: Palette,
    title: 'Unique Designs',
    description: 'Each pattern is meticulously crafted by our expert designers, ensuring originality across all segments from Menswear to Home Interior.',
  },
  {
    icon: Layers,
    title: 'Industrial Formats',
    description: 'Digital patterns are provided in high-resolution TIFF and AI formats at 300+ DPI, optimized for industrial textile printing machinery.',
  },
  {
    icon: Sparkles,
    title: 'Trend-Forward',
    description: 'Our design team utilizes real-time market analytics to stay ahead of global textile trends, bringing you contemporary patterns.',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'We ensure durability and color fastness in our physical fabrics, adhering to international textile quality standards.',
  },
];

const InDetailsSection = () => {
  // ✅ Security: Restrict Right-Click across the entire details section
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <section 
      className="py-16 md:py-24 bg-muted/30 relative overflow-hidden" 
      onContextMenu={handleContextMenu}
    >
      <div className="container px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-[#2A2623] mb-4">
            In Details
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Discover what makes RDC textile designs stand apart. 
            Every detail is synchronized with our industrial production standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {details.map((detail, index) => (
            <div
              key={index}
              className="bg-background rounded-lg p-6 md:p-8 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-300 group select-none"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <detail.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg md:text-xl font-medium text-[#2A2623] mb-3">
                {detail.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {detail.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 bg-background rounded-xl p-6 md:p-10 border border-border/50 relative overflow-hidden">
          {/* ✅ HIGH-VISIBILITY INDUSTRIAL WATERMARK (Consistency layer) */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='20' font-weight='900' fill='none' stroke='black' stroke-width='0.8' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />

          <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <h3 className="font-serif text-2xl md:text-3xl font-medium text-[#2A2623] mb-4">
                Crafted for Excellence
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At RDC, we believe that great textile design is an art form. Our team combines 
                traditional craftsmanship with the data-driven efficiency of our microservice architecture.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Over 1000+ unique designs managed in our Admin Service
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Bespoke customization available via our Home Interior segment
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Secure worldwide transactions powered by Razorpay
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Instant asset streaming from our Media Service
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center backdrop-blur-sm border border-white/20">
                <span className="block font-serif text-3xl md:text-4xl font-semibold text-primary mb-1">1000+</span>
                <span className="text-sm text-muted-foreground font-bold uppercase tracking-tighter">Catalog Designs</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 text-center backdrop-blur-sm border border-white/20">
                <span className="block font-serif text-3xl md:text-4xl font-semibold text-primary mb-1">50+</span>
                <span className="text-sm text-muted-foreground font-bold uppercase tracking-tighter">Global Markets</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 text-center backdrop-blur-sm border border-white/20">
                <span className="block font-serif text-3xl md:text-4xl font-semibold text-primary mb-1">15+</span>
                <span className="text-sm text-muted-foreground font-bold uppercase tracking-tighter">Years in Textile</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 text-center backdrop-blur-sm border border-white/20">
                <span className="block font-serif text-3xl md:text-4xl font-semibold text-primary mb-1">5000+</span>
                <span className="text-sm text-muted-foreground font-bold uppercase tracking-tighter">Verified Orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InDetailsSection;