import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    // Simulate API call
    setTimeout(() => setStatus('success'), 1500);
  };

  return (
    <section className="py-32 bg-[#F8F7F4] border-y border-black/5">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center">
          
          {/* HEADER SECTION */}
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#1A1A1A]/40 block mb-6">
            Stay Connected
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] mb-6">
            Stay Inspired
          </h2>
          
          <div className="w-12 h-[1px] bg-[#1A1A1A]/20 mx-auto mb-8" />
          
          <p className="text-neutral-500 text-sm md:text-base font-light leading-relaxed mb-12 max-w-sm mx-auto italic">
            Receive curated updates on new textile collections, seasonal trends, and exclusive studio releases.
          </p>

          {/* INVITATION FORM */}
          <form 
            onSubmit={handleSubmit}
            className="relative max-w-md mx-auto"
          >
            <div className={cn(
              "flex items-center transition-all duration-700 border-b border-[#1A1A1A]/20 pb-2 group",
              status === 'success' ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100"
            )}>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 bg-transparent border-none outline-none text-sm py-2 placeholder:text-neutral-300 placeholder:italic font-light"
                required
              />
              
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="group/btn flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A] pl-4 hover:opacity-60 transition-all"
              >
                {status === 'loading' ? 'Sending' : 'Join'}
                <ArrowRight className={cn(
                  "w-4 h-4 transition-transform duration-500",
                  status !== 'loading' && "group-hover:translate-x-2"
                )} />
              </button>
            </div>

            {/* SUCCESS MESSAGE */}
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-700",
              status === 'success' ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
            )}>
              <div className="flex items-center gap-3 text-[#1A1A1A]">
                <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">You are on the list</span>
              </div>
            </div>
          </form>

          {/* TRUST FOOTNOTE */}
          <p className="text-[9px] font-medium uppercase tracking-widest text-neutral-400 mt-12 opacity-60">
            No spam. Only curated artistry.
          </p>

        </div>
      </div>
    </section>
  );
};

export default Newsletter;