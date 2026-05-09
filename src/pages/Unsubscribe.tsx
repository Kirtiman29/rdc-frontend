import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';

import {
  getNewsletterErrorMessage,
  unsubscribeFromNewsletter,
} from '@/api/newsletterApi';

type UnsubscribeStatus = 'loading' | 'success' | 'error';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email')?.trim() || '';

  const [status, setStatus] = useState<UnsubscribeStatus>('loading');
  const [message, setMessage] = useState('Processing your unsubscribe request...');

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      if (!email) {
        setStatus('error');
        setMessage('Invalid unsubscribe link.');
        return;
      }

      try {
        const response = await unsubscribeFromNewsletter(email);

        if (!isActive) return;

        setStatus('success');
        setMessage(response.message || 'You have been unsubscribed successfully.');
      } catch (error) {
        if (!isActive) return;

        setStatus('error');
        setMessage(
          getNewsletterErrorMessage(error, 'Unable to process unsubscribe request.')
        );
      }
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [email]);

  return (
    <div className="min-h-screen bg-[#F5F1EA] px-4 py-10 text-[#1A1A1A] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[28px] border border-[#1A1A1A]/10 bg-white shadow-[0_30px_80px_rgba(42,38,35,0.12)]">
          <div className="bg-[radial-gradient(circle_at_top,_rgba(196,171,138,0.22),_transparent_55%),linear-gradient(135deg,_#2A2623,_#403B37)] px-8 py-10 text-white sm:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/65">
              Newsletter
            </p>
            <h1 className="mt-4 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
              Manage your inbox preferences
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              We&apos;re updating your newsletter subscription status for RDC updates,
              launches, and collections.
            </p>
          </div>

          <div className="px-8 py-10 sm:px-10 sm:py-12">
            <div className="flex flex-col gap-6 rounded-[24px] border border-[#1A1A1A]/8 bg-[#F8F6F1] p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    status === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : status === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-[#1A1A1A]/6 text-[#2A2623]'
                  }`}
                >
                  {status === 'loading' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : status === 'success' ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8A8177]">
                    Status
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-[#1A1A1A]">
                    {status === 'loading'
                      ? 'Working on it'
                      : status === 'success'
                        ? 'You are unsubscribed'
                        : 'We hit a snag'}
                  </h2>
                </div>
              </div>

              <p className="text-base leading-7 text-[#403B37]">{message}</p>

              {email && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#1A1A1A]/8 bg-white px-4 py-3 text-sm text-[#403B37]">
                  <Mail className="h-4 w-4 shrink-0 text-[#8A8177]" />
                  <span>{email}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-[#2A2623] px-6 text-sm font-bold text-white transition-colors hover:bg-black"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return Home
                </Link>
                <Link
                  to="/blogs"
                  className="inline-flex h-12 items-center justify-center rounded-sm border border-[#1A1A1A]/12 px-6 text-sm font-semibold text-[#2A2623] transition-colors hover:bg-[#1A1A1A]/4"
                >
                  Visit Blog
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Unsubscribe;
