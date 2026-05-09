import { useState } from 'react';
import { AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react';

import {
  getNewsletterErrorMessage,
  subscribeToNewsletter,
} from '@/api/newsletterApi';
import { cn } from '@/lib/utils';

type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await subscribeToNewsletter({
        email: normalizedEmail,
        source: 'footer',
      });

      setStatus('success');
      setMessage(response.message || 'Subscribed successfully.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(getNewsletterErrorMessage(error));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
    }
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

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <label className="block flex-1">
              <span className="mb-4 block text-sm font-semibold text-[#2A2623]">
                Your email address
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
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
              {status === 'loading' ? 'Submitting...' : 'Subscribe'}
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-300',
                    'group-hover:translate-x-1'
                  )}
                />
              )}
            </button>
          </div>

          {message && (
            <div
              className={cn(
                'mt-5 flex items-start gap-3 rounded-sm border px-4 py-3 text-sm',
                status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {status === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <p className="font-medium">{message}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Newsletter;
