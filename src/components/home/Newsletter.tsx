import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setTimeout(() => setStatus('success'), 1500);
  };

  return (
    <div className="rounded-[24px] border border-white/50 bg-[#F8F6F1] px-6 py-8 text-[#1A1A1A] shadow-[0_18px_45px_rgba(0,0,0,0.08)] md:px-8 md:py-9 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.95fr)] lg:items-center lg:gap-12">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#8A8177]">
            Newsletter
          </p>

          <h3 className="mt-4 max-w-lg font-serif text-3xl leading-[1.08] text-[#1A1A1A] md:text-4xl lg:text-[3rem]">
            Get news, trends and updates in your inbox
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="relative w-full">
          <div
            className={cn(
              'transition-all duration-500',
              status === 'success'
                ? 'pointer-events-none translate-y-3 opacity-0'
                : 'translate-y-0 opacity-100'
            )}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-end">
              <label className="block flex-1">
                <span className="mb-4 block text-sm font-semibold text-[#2A2623]">
                  Your email address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-12 w-full border-0 border-b border-[#1A1A1A]/16 bg-transparent px-0 text-base text-[#1A1A1A] outline-none transition-colors placeholder:text-[#B6AEA4] focus:border-[#1A1A1A]/45"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="group inline-flex h-14 items-center justify-center gap-3 rounded-[2px] bg-[#373332] px-8 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-70 md:min-w-[160px]"
              >
                {status === 'loading' ? 'Submitting' : 'Subscribe'}
                <ArrowRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-300',
                    status !== 'loading' && 'group-hover:translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>

          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-all duration-500 md:justify-start',
              status === 'success'
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-3 opacity-0'
            )}
          >
            <div className="flex items-center gap-3 text-[#1A1A1A]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1A1A1A]/10 bg-white/80">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">You are subscribed.</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Newsletter;
