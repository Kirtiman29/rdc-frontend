import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Maximize,
  Palette,
  Search,
  Sparkles,
  SwatchBook,
  Wand2,
} from 'lucide-react';

const studioTools = [
  {
    title: 'Generate Design',
    description: 'Create original textile directions faster with prompt-led generation.',
    icon: Wand2,
  },
  {
    title: 'Pattern Finder',
    description: 'Explore visual directions and discover references for new collections.',
    icon: Search,
  },
  {
    title: 'Recolor Studio',
    description: 'Test alternate palettes and color stories without restarting the process.',
    icon: Palette,
  },
  {
    title: 'Upscale & Separation',
    description: 'Refine outputs for production workflows with upscale and color tools.',
    icon: Maximize,
  },
];

const studioHighlights = [
  'Generate, recolor, upscale, and refine',
  'Built for textile-first creative workflows',
  'Open the full studio for detailed tools',
];

const AIStudioSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const reveal = (delayClass: string) =>
    isVisible ? `opacity-100 translate-y-0 ${delayClass}` : 'opacity-0 translate-y-5';

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#0A0A0A] py-20 text-white md:py-28"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-[-8%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[#BA1B1C]/10 blur-[130px]" />
        <div className="absolute bottom-[-12%] right-[-8%] h-[360px] w-[360px] rounded-full bg-[#153A65]/12 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div>
            <span
              className={`mb-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-neutral-400 transition-all duration-1000 ease-out md:text-xs ${reveal('delay-0')}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Studio
            </span>

            <h2
              className={`font-serif text-4xl font-light tracking-tight text-white transition-all duration-1000 ease-out md:text-6xl ${reveal('delay-150')}`}
            >
              Explore the AI tools built for your studio.
            </h2>

            <p
              className={`mx-auto mt-6 max-w-2xl text-sm font-light leading-7 text-neutral-400 transition-all duration-1000 ease-out md:text-base ${reveal('delay-300')}`}
            >
              Generate, recolor, search, and refine textile directions in one connected workspace.
            </p>
          </div>
        </div>

        <div className={`transition-all duration-1000 ease-out ${reveal('delay-450')}`}>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-500">
                Studio Preview
              </p>
              <h3 className="mt-3 font-serif text-3xl font-light text-white md:text-4xl">
                See the core tools at a glance.
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/ai-studio"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-white px-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A] transition-transform hover:-translate-y-0.5"
              >
                Open AI Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/subscription"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5 hover:bg-white/[0.06]"
              >
                View AI Access
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {studioHighlights.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-medium text-neutral-300"
              >
                <SwatchBook className="h-3.5 w-3.5 text-[#BA1B1C]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {studioTools.map((tool, index) => (
              <article
                key={tool.title}
                className={`rounded-[24px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-white/14 ${reveal(`delay-${(index + 1) * 150}`)}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#BA1B1C]">
                  <tool.icon className="h-5 w-5" />
                </div>

                <h4 className="mt-6 text-xl font-semibold text-white">{tool.title}</h4>
                <p className="mt-3 text-sm font-light leading-7 text-neutral-400">
                  {tool.description}
                </p>

                <Link
                  to="/ai-studio"
                  className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white transition-transform hover:translate-x-1"
                >
                  Explore Tool
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .delay-0 { transition-delay: 0ms; }
        .delay-150 { transition-delay: 150ms; }
        .delay-300 { transition-delay: 300ms; }
        .delay-450 { transition-delay: 450ms; }
        .delay-600 { transition-delay: 600ms; }
      `}</style>
    </section>
  );
};

export default AIStudioSection;
