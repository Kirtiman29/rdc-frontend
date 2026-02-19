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
    // ✅ Sync: Referencing the Segment-based design logic in Admin Service
    description: 'Each pattern is crafted exclusively for our diverse segments, ensuring unique pieces managed through our centralized admin registry.',
  },
  {
    icon: Award,
    title: 'Industrial Quality',
    // ✅ Sync: Referencing the High-Res assets (TIFF/AI) managed in Port 8090
    description: 'We utilize high-resolution industrial file standards and secure asset streaming from our dedicated media service for exceptional results.',
  },
  {
    icon: Truck,
    title: 'Global Delivery',
    // ✅ Sync: Referencing the Order Service (Port 8095) fulfillment logic
    description: 'Secure worldwide fulfillment with real-time status tracking powered by our dedicated order management microservice.',
  },
  {
    icon: HeartHandshake,
    title: 'Technical Support',
    description: 'Our consultants provide technical guidance on pattern integration and industrial textile application for your specialized projects.',
  },
];

const ValueProposition = () => {
  return (
    <section className="border-y border-border bg-background py-16 md:py-24">
      <div className="container px-4 mx-auto">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Why Choose Us
          </span>
          <h2 className="font-serif text-3xl font-medium md:text-4xl text-[#2A2623] uppercase tracking-tight">
            Crafted with Purpose
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <div
                key={value.title}
                className="group text-center animate-fade-in select-none"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-border transition-all duration-300 group-hover:border-[#2A2623] group-hover:bg-[#2A2623]/5">
                  <IconComponent className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-[#2A2623]" />
                </div>
                <h3 className="mb-3 font-serif text-xl font-medium text-[#2A2623] uppercase italic">
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-[250px] mx-auto">
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