//src/components/home/CallToAction.tsx
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CallToAction = () => {
  return (
    <section className="relative overflow-hidden bg-foreground py-16 text-background md:py-24">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container relative px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block font-serif text-sm uppercase tracking-[0.3em] opacity-70">
            Bespoke Services
          </span>
          <h2 className="mb-6 font-serif text-3xl font-medium leading-tight md:text-4xl lg:text-5xl">
            Bring Your Vision to Life
          </h2>
          <p className="mb-8 text-base leading-relaxed opacity-80 md:text-lg">
            Our custom design service connects you with expert textile designers who will 
            create exclusive patterns tailored to your specific needs. From concept to 
            completion, we're here to help.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="group px-8"
            >
              {/* ✅ Sync: Routing to the 'Custom' segment filtered in Admin Service (Port 8080) */}
              {/* This matches the 'segment' filter logic in your DesignFilters interface */}
              <Link to="/gallery?segment=HOME_INTERIOR">
                Start Your Project
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/30 bg-transparent px-8 text-background hover:bg-background/10 hover:text-background"
            >
              {/* ✅ Sync: Standard contact route for bespoke inquiries */}
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;