import { Quote } from 'lucide-react';

const Testimonial = () => {
  return (
    <section className="bg-secondary py-16 md:py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Quote className="mx-auto mb-6 h-10 w-10 text-champagne" />
          <blockquote className="mb-8 font-serif text-2xl font-light leading-relaxed text-foreground md:text-3xl lg:text-4xl">
            "The quality of these textiles transformed our entire project. The attention to detail 
            and the unique patterns are simply unmatched. Working with Atelier has been an 
            absolute pleasure."
          </blockquote>
          <div className="flex flex-col items-center">
            <div className="mb-3 h-14 w-14 overflow-hidden rounded-full bg-muted">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
                alt="Sarah Mitchell"
                className="h-full w-full object-cover"
              />
            </div>
            <cite className="not-italic">
              <span className="block font-serif text-base font-medium">Sarah Mitchell</span>
              <span className="text-sm text-muted-foreground">Interior Designer, London</span>
            </cite>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
