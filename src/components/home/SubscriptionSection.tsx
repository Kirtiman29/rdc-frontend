// src/components/home/SubscriptionSection.tsx

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';

import {
  getPlans,
  type BillingCycle,
  type SubscriptionPlan,
} from '@/api/subscriptionApi';
import { useToast } from '@/hooks/use-toast';

type ApiErrorLike = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const data = (error as ApiErrorLike)?.response?.data;
  return data?.message || data?.error || (error instanceof Error ? error.message : fallback);
};

const getPlanOrder = (planType: SubscriptionPlan['planType']) => {
  switch (planType) {
    case 'DESIGN':
      return 0;
    case 'COMBO':
      return 1;
    case 'AI':
      return 2;
    default:
      return 3;
  }
};

const planTypeCopy: Record<
  SubscriptionPlan['planType'],
  { label: string; description: string }
> = {
  DESIGN: {
    label: 'Design Access',
    description:
      'For teams that want curated textile designs ready for sourcing, range planning, and collection development.',
  },
  COMBO: {
    label: 'Complete Workflow',
    description:
      'For studios that want premium design access and AI support working together in a single workflow.',
  },
  AI: {
    label: 'AI Studio Access',
    description:
      'For faster concept generation, experimentation, recoloring, and creative iteration with AI credits.',
  },
};

const formatCycles = (cycles: BillingCycle[]) => {
  if (cycles.length === 2) {
    return 'Monthly and yearly plans';
  }

  return cycles[0] === 'YEARLY' ? 'Yearly plans' : 'Monthly plans';
};

const getPreviewHighlights = (plans: SubscriptionPlan[]) => {
  const designLimit = Math.max(...plans.map((plan) => plan.designLimit));
  const creditLimit = Math.max(...plans.map((plan) => plan.creditLimit));
  const cycles = Array.from(new Set(plans.map((plan) => plan.billingCycle))).sort() as BillingCycle[];
  const highlights = [formatCycles(cycles)];

  if (designLimit > 0) {
    highlights.push(`Up to ${designLimit} design usages`);
  }

  if (creditLimit > 0) {
    highlights.push(`Up to ${creditLimit} AI credits`);
  }

  highlights.push('Pricing and billing details on the plans page');

  return highlights;
};

const SubscriptionSection = () => {
  const { toast } = useToast();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await getPlans();
        setPlans(response);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Plans unavailable',
          description: getApiErrorMessage(error, 'Subscription plans could not be loaded.'),
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPlans();
  }, [toast]);

  const animate = (delayClass: string) =>
    isVisible ? `opacity-100 translate-y-0 ${delayClass}` : 'opacity-0 translate-y-4';

  const previewPlans = [...new Set(plans.map((plan) => plan.planType))]
    .sort((first, second) => getPlanOrder(first) - getPlanOrder(second))
    .map((planType) => ({
      planType,
      ...planTypeCopy[planType],
      highlights: getPreviewHighlights(plans.filter((plan) => plan.planType === planType)),
    }));

  return (
    <section
      id="subscriptions"
      ref={sectionRef}
      className="w-full overflow-hidden bg-[#F5F4F0] py-20 text-[#1A1A1A] md:py-28"
    >
      <div className="container px-6 mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span
            className={`mb-6 inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.4em] text-neutral-500 transition-all duration-1000 ease-out md:text-xs ${animate('delay-0')}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Subscription Access
          </span>

          <h2
            className={`font-serif text-4xl font-light tracking-tight text-[#2A2623] transition-all duration-1000 ease-out md:text-6xl ${animate('delay-150')}`}
          >
            Choose the access path that fits your studio.
          </h2>

          <p
            className={`mx-auto mt-6 max-w-2xl font-sans text-sm font-light leading-7 text-neutral-600 transition-all duration-1000 ease-out md:text-base ${animate('delay-300')}`}
          >
            Explore design access, AI tools, or a combined workflow here, then open the
            full subscription page for pricing and detailed comparison.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : previewPlans.length === 0 ? (
          <div className="mx-auto max-w-xl border border-neutral-200 bg-white/60 p-8 text-center rounded-sm">
            <p className="text-sm text-neutral-500">Plans are not available right now.</p>
          </div>
        ) : (
          <div className={`transition-all duration-1000 ease-out ${animate('delay-450')}`}>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-500">
                  Subscription Preview
                </p>
                <h3 className="mt-3 font-serif text-3xl font-light text-[#2A2623] md:text-4xl">
                  See the access paths at a glance.
                </h3>
              </div>

              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#2A2623] transition-transform hover:translate-x-1"
              >
                Open full subscription page
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {previewPlans.map((plan) => {
                const isCombo = plan.planType === 'COMBO';

                return (
                  <article
                    key={plan.planType}
                    className={`group flex h-full flex-col rounded-sm border p-6 shadow-[0_18px_40px_rgba(42,38,35,0.06)] transition-all duration-300 hover:-translate-y-1 ${
                      isCombo
                        ? 'border-[#2A2623] bg-[#2A2623] text-white'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-[0.25em] ${
                            isCombo ? 'text-white/60' : 'text-neutral-400'
                          }`}
                        >
                          {plan.planType}
                        </p>
                        <h3
                          className={`mt-2 text-2xl font-semibold ${
                            isCombo ? 'text-white' : 'text-[#2A2623]'
                          }`}
                        >
                          {plan.label}
                        </h3>
                        <p
                          className={`mt-3 text-sm leading-6 ${
                            isCombo ? 'text-white/75' : 'text-neutral-600'
                          }`}
                        >
                          {plan.description}
                        </p>
                      </div>
                      {isCombo && (
                        <span className="rounded-sm bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#2A2623]">
                          Best Value
                        </span>
                      )}
                    </div>

                    <div
                      className={`mb-6 rounded-sm border p-4 ${
                        isCombo ? 'border-white/10 bg-white/5' : 'border-current/10 bg-black/[0.02]'
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.24em] ${
                          isCombo ? 'text-white/60' : 'text-neutral-400'
                        }`}
                      >
                        What You Get
                      </p>
                      <p
                        className={`mt-3 text-base leading-7 ${
                          isCombo ? 'text-white/80' : 'text-neutral-600'
                        }`}
                      >
                        A cleaner preview here, with the complete pricing and plan-level
                        comparison reserved for the subscription page.
                      </p>
                    </div>

                    <ul className="mb-8 space-y-3">
                      {plan.highlights.map((benefit) => (
                        <li
                          key={benefit}
                          className={`flex items-start gap-3 text-sm ${
                            isCombo ? 'text-white/80' : 'text-neutral-600'
                          }`}
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 ${
                              isCombo ? 'text-white' : 'text-emerald-600'
                            }`}
                          />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/subscription"
                      className={`mt-auto inline-flex h-12 w-full items-center justify-center rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] ${
                        isCombo
                          ? 'bg-white text-[#2A2623] hover:bg-white/90'
                          : 'bg-[#2A2623] text-white hover:bg-black'
                      }`}
                    >
                      View Full Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .delay-0 { transition-delay: 0ms; }
        .delay-150 { transition-delay: 150ms; }
        .delay-300 { transition-delay: 300ms; }
        .delay-450 { transition-delay: 450ms; }
      `}} />
    </section>
  );
};

export default SubscriptionSection;
