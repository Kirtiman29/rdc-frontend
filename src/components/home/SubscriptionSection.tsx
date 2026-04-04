//src/components/home/SubscriptionSection.tsx

import React, { useEffect, useRef, useState } from 'react';

const SubscriptionSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation helper to apply classes only when visible
  const animate = (delayClass: string) => 
    isVisible ? `opacity-100 translate-y-0 ${delayClass}` : 'opacity-0 translate-y-4';

  return (
    <section 
      ref={sectionRef}
      className="w-full py-24 md:py-32 bg-[#F5F4F0] text-[#1A1A1A] overflow-hidden"
    >
      <div className="container px-6 mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          
          {/* 1. Label */}
          <span 
            className={`font-sans text-[10px] md:text-xs uppercase tracking-[0.5em] text-neutral-400 mb-6 transition-all duration-1000 ease-out ${animate('delay-0')}`}
          >
            Coming Soon
          </span>

          {/* 2. Main Heading - Elegant Serif */}
          <h2 
            className={`font-serif text-4xl md:text-6xl font-light tracking-tight mb-6 transition-all duration-1000 ease-out ${animate('delay-150')}`}
          >
            Subscription Plans
          </h2>

          {/* 3. Subtle Divider Line */}
          <div 
            className={`w-12 h-[1px] bg-neutral-300 mb-10 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'} origin-center`} 
          />

          {/* 4. Subheading - Sophisticated Sans */}
          <h3 
            className={`font-sans text-xl md:text-2xl font-light text-neutral-700 leading-relaxed mb-4 max-w-md transition-all duration-1000 ease-out ${animate('delay-300')}`}
          >
            Access curated textile design bundles crafted for fashion and interior brands.
          </h3>

          {/* 5. Description - Muted & Small */}
          <p 
            className={`font-sans text-sm md:text-base text-neutral-500 mb-12 font-light transition-all duration-1000 ease-out ${animate('delay-450')}`}
          >
            High-resolution TIFF design bundles for commercial use.
          </p>

          {/* 6. CTA Link with Underline Effect */}
          <div className={`transition-all duration-1000 ease-out ${animate('delay-600')}`}>
            <span className="relative inline-block cursor-default group py-1">
              <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.4em] text-neutral-400 transition-colors duration-500 group-hover:text-black">
                Launching Soon
              </span>
              {/* Subtle Underline Animation */}
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-neutral-300 origin-left scale-x-100 group-hover:scale-x-[0.2] transition-transform duration-700 ease-in-out" />
            </span>
          </div>

        </div>
      </div>

      {/* Tailwind Utility Class Injections for Delays */}
      <style dangerouslySetInnerHTML={{ __html: `
        .delay-0 { transition-delay: 0ms; }
        .delay-150 { transition-delay: 150ms; }
        .delay-300 { transition-delay: 300ms; }
        .delay-450 { transition-delay: 450ms; }
        .delay-600 { transition-delay: 600ms; }
      `}} />
    </section>
  );
};

export default SubscriptionSection;