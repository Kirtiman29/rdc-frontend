import { Quote } from 'lucide-react';

const Testimonial = () => {
  // ✅ Security: Restrict Right-Click to protect editorial brand content
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <section 
      className="bg-secondary/40 py-16 md:py-24 border-y border-border/50" 
      onContextMenu={handleContextMenu}
    >
      <div className="container px-4 mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          {/* ✅ Sync: Using primary brand color for consistency */}
          <Quote className="mx-auto mb-8 h-12 w-12 text-[#2A2623] opacity-20" />
          
          <blockquote className="mb-10 font-serif text-2xl font-light leading-relaxed text-[#2A2623] md:text-3xl lg:text-4xl italic">
            "The quality of these textiles transformed our entire project. The attention to detail 
            and the unique patterns from the Home Interior segment are simply unmatched. 
            The high-resolution industrial files made our production workflow seamless."
          </blockquote>

          <div className="flex flex-col items-center">
            <div className="mb-4 h-16 w-16 overflow-hidden rounded-full bg-muted shadow-lg border-2 border-white select-none">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
                alt="Sarah Mitchell"
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
            <cite className="not-italic">
              <span className="block font-serif text-lg font-medium text-[#2A2623] uppercase tracking-wide">
                Sarah Mitchell
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 block">
                Lead Designer, Home Interior Group
              </span>
            </cite>
          </div>
        </div>
      </div>

      {/* ✅ High-Visibility Industrial Watermark */}
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