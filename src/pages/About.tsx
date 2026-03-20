// src/pages/About.tsx

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Our Story
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-3">
              About RDC Studio
            </h1>
          </div>

          {/* Content */}
<div className="space-y-12 md:space-y-16">

  {/* Intro */}
  <section className="text-center">
    <h2 className="text-sm font-medium uppercase tracking-widest text-primary mb-4">
      Built for Modern Textile Production
    </h2>
    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
      RDC Studio is a modern digital textile studio built for today’s fast-moving
      design and manufacturing world. We simplify how textile designs are discovered,
      selected, and brought into production—bridging strong creative vision with real-world
      manufacturing needs.
    </p>
  </section>

  {/* What We Do */}
  <section>
    <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
      Designs That Perform Beyond the Screen
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      At RDC, we don’t just create patterns—we create designs that are ready to perform
      visually, technically, and commercially. Our platform gives brands 24/7 access to
      a curated library of production-ready surface patterns aligned with global trends.
    </p>
    <p className="text-muted-foreground leading-relaxed">
      Whether you're an emerging label or an established manufacturer, RDC helps you
      move faster—from idea to execution—without unnecessary delays or guesswork.
    </p>
  </section>

  {/* What Makes Us Different */}
  <section>
    <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
      What Makes RDC Different
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      In the textile industry, a good design is not enough—it must translate seamlessly
      into production. That’s where RDC stands apart.
    </p>

    <ul className="space-y-4">
      <li className="flex gap-3">
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
        <p className="text-muted-foreground">Thoughtful research behind every design</p>
      </li>
      <li className="flex gap-3">
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
        <p className="text-muted-foreground">Strong color understanding and trend alignment</p>
      </li>
      <li className="flex gap-3">
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
        <p className="text-muted-foreground">Deep practical knowledge of textile manufacturing</p>
      </li>
    </ul>

    <p className="text-muted-foreground leading-relaxed mt-4">
      This ensures that what you see on screen is exactly what works in real production.
    </p>
  </section>

  {/* Approach */}
  <section>
    <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
      Our Approach
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      We combine creativity with clarity. Art with application. Design with purpose.
    </p>
    <p className="text-muted-foreground leading-relaxed">
      Our goal is simple—to give brands designs they can trust. From curated collections
      to ready-to-download files, everything at RDC is built to save time, reduce errors,
      and support better decision-making.
    </p>
  </section>

  {/* Founder Story */}
  <section>
    <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
      Our Founder’s Vision
    </h2>
    <p className="text-muted-foreground leading-relaxed mb-4">
      In 2020, Ruchita Gudhka started her textile design studio with one clear mission:
      to create designs that don’t just look good on screen but also work in real production.
    </p>
    <p className="text-muted-foreground leading-relaxed">
      With years of experience in the fashion industry, she identified a major gap—many
      designs lacked proper research and technical understanding, leading to delays and
      inefficiencies for manufacturers. RDC was built to solve this problem through
      in-house research, ready-to-print designs, and a deep understanding of real
      manufacturing needs.
    </p>
  </section>

  {/* Closing */}
  <section className="text-center pt-8 border-t border-border">
    <blockquote className="font-serif text-xl md:text-2xl italic text-foreground/80 max-w-2xl mx-auto">
      "More than just a design library—RDC is a complete system built for real brands,
      real production, and real results."
    </blockquote>
  </section>

</div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;