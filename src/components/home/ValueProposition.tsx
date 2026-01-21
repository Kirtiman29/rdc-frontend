import { Palette, Award, Truck, HeartHandshake, LucideIcon } from 'lucide-react';

interface ValueItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const values: ValueItem[] = [
  {
    icon: Palette,
    title: 'Original Designs',
    description: 'Each pattern is crafted exclusively by our in-house designers, ensuring unique pieces you will not find anywhere else.',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'We source only the finest materials and use high-resolution printing techniques for exceptional results.',
  },
  {
    icon: Truck,
    title: 'Global Delivery',
    description: 'Secure worldwide shipping with careful packaging to ensure your textiles arrive in perfect condition.',
  },
  {
    icon: HeartHandshake,
    title: 'Dedicated Support',
    description: 'Our design consultants are here to help you find the perfect textile solution for your project.',
  },
];

const ValueProposition = () => {
  return (
    <section className="border-y border-border bg-background py-16 md:py-24">
      <div className="container px-4">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Why Choose Us
          </span>
          <h2 className="font-serif text-3xl font-medium md:text-4xl">
            Crafted with Purpose
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <div
                key={value.title}
                className="group text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-border transition-colors group-hover:border-champagne group-hover:bg-champagne/10">
                  <IconComponent className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-champagne-foreground" />
                </div>
                <h3 className="mb-2 font-serif text-lg font-medium">{value.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
