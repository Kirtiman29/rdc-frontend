//src/components/home/Testimonial.tsx

import { Quote } from 'lucide-react';

const Testimonial = () => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <section 
      className="relative bg-secondary/40 py-16 md:py-24 border-y border-border/50" 
      onContextMenu={handleContextMenu}
    >
      <div className="container px-4 mx-auto">

        {/* ================= TESTIMONIAL ================= */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          
          <Quote className="mx-auto mb-6 h-10 w-10 text-[#2A2623] opacity-20" />
          
          <blockquote className="mb-6 font-serif text-xl md:text-2xl lg:text-3xl font-light leading-relaxed text-[#2A2623] italic">
            "Empowering clients with creative excellence, inspired leadership, and a thriving atmosphere. We listen deeply, deliver on time, and prioritize your vision—India’s premier textile prints, client-first."
          </blockquote>

        </div>

 {/* ================= ABOUT OVERVIEW ================= */}
<div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-5xl mx-auto text-center md:text-center">

  {/* LEFT: TEXT */}
  <div className="flex flex-col items-center">

    <span className="mb-2 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
      About RDC
    </span>

    <h2 className="font-serif text-2xl md:text-3xl font-medium text-[#2A2623] mb-4">
      Built for Modern Textile Production
    </h2>

    <p className="text-muted-foreground leading-relaxed mb-4 max-w-md">
      RDC Studio is a contemporary textile studio shaped for today's fast-evolving design and landscape. We bridge the gap between creative vision and technical execution-optimizing how textile designs are sourced, translated, and brought to life.
    </p>

    <p className="text-muted-foreground leading-relaxed max-w-md">
      Our studio delivers a curated collection of surface patterns, aligned with global trends and built for seamless integration. We empower brands to move from concept to final product with clarity, efficiency, and confidence

    </p>
  </div>

  {/* RIGHT: FOUNDER */}
  <div className="flex flex-col items-center">

    {/* Founder Image */}
    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-muted border border-border shadow-md mb-5">
      <img
        src="/founder.jpeg"
        alt="Founder"
        className="w-full h-full object-cover"
      />
    </div>

    {/* Founder Name */}
    <h3 className="font-serif text-lg font-medium text-[#2A2623] uppercase tracking-wide">
      Ruchita Gudhka
    </h3>

    {/* Founder Role */}
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
      Founder, Ruchita Design Pvt. Ltd.
    </span>

  </div>

</div>

      </div>

      {/* WATERMARK */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='24' font-weight='900' fill='none' stroke='black' stroke-width='0.5' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
    </section>
  );
};

export default Testimonial;