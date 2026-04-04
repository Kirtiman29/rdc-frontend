//src/components/home/AIStudioSection.tsx
import React, { useEffect, useRef, useState } from 'react';

const AIStudioSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const reveal = (delay: string) =>
    `transition-all duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${delay} ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
    }`;

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-16 md:py-28 bg-[#0A0A0A] text-white overflow-hidden"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#BA1B1C]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row items-start sm:items-center justify-between gap-10 lg:gap-16">

          {/* LEFT CONTENT */}
          <div className="w-full lg:w-1/2 flex flex-col items-start">

            {/* Badge */}
            <div className={`mb-4 ${reveal('delay-0')}`}>
              <span className="px-4 py-1.5 border border-neutral-800 rounded-full text-xs uppercase tracking-[0.3em] text-neutral-300 font-semibold bg-white/[0.02] backdrop-blur-sm shadow-[0_0_20px_rgba(186,27,28,0.15)]">
                COMING SOON
              </span>
            </div>

            {/* Heading */}
            <h2 className={`font-serif text-4xl sm:text-5xl md:text-7xl font-light leading-[1.1] sm:leading-[1.05] tracking-tight mb-6 ${reveal('delay-100')}`}>
              AI Design{' '}
              <span className="block sm:inline text-[#BA1B1C] italic opacity-90">
                Studio
              </span>
            </h2>

            {/* Divider */}
            <div className={`w-14 h-[1px] bg-neutral-800 mb-6 origin-left transition-transform duration-1000 ${isVisible ? 'scale-x-100' : 'scale-x-0'}`} />

            {/* Subheading */}
            <h3 className={`font-sans text-lg sm:text-xl md:text-2xl font-light text-neutral-300 max-w-full sm:max-w-md leading-relaxed mb-5 ${reveal('delay-200')}`}>
              Generate complex textile patterns with high-fidelity neural control.
            </h3>

            {/* Description */}
            <p className={`font-sans text-sm md:text-base text-neutral-500 max-w-full sm:max-w-sm leading-relaxed mb-6 font-light ${reveal('delay-300')}`}>
              Experience a future where creative intuition meets industrial precision.
              Coming soon to RDC Textile.
            </p>

            {/* Status */}
            <div className={`flex items-center gap-3 ${reveal('delay-400')}`}>
              <div className="w-2 h-2 rounded-full bg-[#BA1B1C] animate-pulse" />
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-medium">
                Launching Soon
              </span>
            </div>

          </div>

          {/* RIGHT VISUAL */}
          <div className={`w-full lg:w-1/2 flex justify-center lg:justify-end ${reveal('delay-500')}`}>
            <div className="relative w-full max-w-[300px] sm:max-w-[420px] aspect-[4/5] sm:aspect-[3/4] group">

              {/* Floating blobs */}
              <div className="absolute top-1/4 -left-10 w-48 sm:w-56 h-48 sm:h-56 bg-[#BA1B1C]/10 blur-[80px] rounded-full animate-float-slow" />
              <div className="absolute bottom-1/4 -right-10 w-48 sm:w-56 h-48 sm:h-56 bg-blue-500/10 blur-[80px] rounded-full animate-float-medium" />

              {/* Glass UI */}
              <div className="relative w-full h-full border border-white/10 rounded-2xl bg-white/[0.02] backdrop-blur-3xl overflow-hidden shadow-xl">

                {/* texture */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/silk.png')] mix-blend-overlay transition-transform duration-700 group-hover:scale-110" />

                {/* scan line */}
                <div className="absolute inset-x-0 h-28 sm:h-32 bg-gradient-to-b from-transparent via-[#BA1B1C]/20 to-transparent -top-28 sm:-top-32 animate-scan" />

                {/* center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block px-5 sm:px-6 py-2 sm:py-3">
                      <div className="absolute inset-0 border border-white/10 blur-[1px] rounded-full" />
                      <span className="relative z-10 text-[9px] sm:text-[10px] uppercase tracking-[0.5em] text-white/40">
                        Processing
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* glow */}
              <div className="absolute -bottom-6 sm:-bottom-8 inset-x-8 sm:inset-x-10 h-14 sm:h-16 bg-[#BA1B1C]/20 blur-[60px] rounded-full opacity-60" />
            </div>
          </div>

        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(500px); }
        }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 8s ease-in-out infinite; }
        .animate-scan { animation: scan 4s linear infinite; }
      `}</style>
    </section>
  );
};

export default AIStudioSection;