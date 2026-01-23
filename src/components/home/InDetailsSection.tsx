import { Palette, Layers, Sparkles, Award } from 'lucide-react';

const details = [
  {
    icon: Palette,
    title: 'Unique Designs',
    description: 'Each pattern is meticulously crafted by our expert designers, ensuring originality and artistic excellence in every piece.',
  },
  {
    icon: Layers,
    title: 'High-Resolution Files',
    description: 'All digital patterns come in multiple formats (PNG, SVG, AI) at 300+ DPI, perfect for printing on any fabric type.',
  },
  {
    icon: Sparkles,
    title: 'Trend-Forward',
    description: 'Our design team stays ahead of global textile trends, bringing you patterns that are both timeless and contemporary.',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'We source only the finest materials for our physical fabrics, ensuring durability, color fastness, and exceptional feel.',
  },
];

const InDetailsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-4">
            In Details
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Discover what makes RDC textile designs stand apart from the rest. 
            Every detail matters in creating exceptional patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {details.map((detail, index) => (
            <div
              key={index}
              className="bg-background rounded-lg p-6 md:p-8 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <detail.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg md:text-xl font-medium text-foreground mb-3">
                {detail.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {detail.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 bg-background rounded-xl p-6 md:p-10 border border-border/50">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-4">
                Crafted for Excellence
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At RDC, we believe that great textile design is an art form. Our team of skilled designers 
                combines traditional craftsmanship with modern technology to create patterns that inspire.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Over 1000+ unique designs in our collection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Customization available for all patterns
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Worldwide shipping on physical products
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Instant digital downloads available
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <span className="block font-serif text-3xl md:text-4xl font-semibold text-primary mb-1">1000+</span>
                <span className="text-sm text-muted-foreground">Unique Designs</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <span className="block font-serif text-3xl md:text-4xl font-semibold text-primary mb-1">50+</span>
                <span className="text-sm text-muted-foreground">Countries Served</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <span className="block font-serif text-3xl md:text-4xl font-semibold text-primary mb-1">15+</span>
                <span className="text-sm text-muted-foreground">Years Experience</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <span className="block font-serif text-3xl md:text-4xl font-semibold text-primary mb-1">5000+</span>
                <span className="text-sm text-muted-foreground">Happy Clients</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InDetailsSection;
