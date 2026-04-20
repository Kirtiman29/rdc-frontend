// src/components/home/SubscriptionSection.tsx

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Sparkles, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getToken } from '@/api/apiClient';
import {
  formatPlanPrice,
  getPlans,
  initiateSubscriptionPayment,
  openSubscriptionCheckout,
  verifySubscriptionPayment,
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

const getPlanBenefits = (plan: SubscriptionPlan) => {
  const benefits = [];

  if (plan.planType === 'DESIGN' || plan.planType === 'COMBO') {
    benefits.push(`${plan.designLimit} design usages`);
  }

  if (plan.planType === 'AI' || plan.planType === 'COMBO') {
    benefits.push(`${plan.creditLimit} AI credits`);
  }

  benefits.push(`${plan.billingCycle.toLowerCase()} renewal`);

  return benefits;
};

const SubscriptionSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState<number | null>(null);

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

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!getToken()) {
      navigate('/login', { state: { from: '/#subscriptions' } });
      return;
    }

    setPayingPlanId(plan.id);

    try {
      const payment = await initiateSubscriptionPayment(plan.id);

      await openSubscriptionCheckout({
        payment,
        onSuccess: async (response) => {
          const verification = await verifySubscriptionPayment(response);

          if (verification.status !== 'SUCCESS' && verification.status !== 'PAID') {
            throw new Error('Payment verification failed');
          }

          toast({
            title: 'Subscription activated',
            description: `${payment.planName} is ready to use.`,
          });
          setPayingPlanId(null);
          navigate('/profile');
        },
        onDismiss: () => setPayingPlanId(null),
        onFailure: () => {
          setPayingPlanId(null);
          toast({
            variant: 'destructive',
            title: 'Payment failed',
            description: 'Razorpay could not complete the payment. Please try again.',
          });
        },
      });
    } catch (error) {
      setPayingPlanId(null);
      toast({
        variant: 'destructive',
        title: 'Subscription payment failed',
        description: getApiErrorMessage(error, 'Please try again in a moment.'),
      });
    }
  };

  return (
    <section
      id="subscriptions"
      ref={sectionRef}
      className="w-full py-20 md:py-28 bg-[#F5F4F0] text-[#1A1A1A] overflow-hidden"
    >
      <div className="container px-6 mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className={`inline-flex items-center gap-2 font-sans text-[10px] md:text-xs uppercase tracking-[0.4em] text-neutral-500 mb-6 transition-all duration-1000 ease-out ${animate('delay-0')}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Plans
          </span>

          <h2
            className={`font-serif text-4xl md:text-6xl font-light tracking-tight mb-6 transition-all duration-1000 ease-out ${animate('delay-150')}`}
          >
            Subscription Plans
          </h2>

          <div
            className={`w-12 h-[1px] bg-neutral-300 mb-8 mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'} origin-center`}
          />

          <p
            className={`font-sans text-sm md:text-base text-neutral-500 mb-12 font-light transition-all duration-1000 ease-out ${animate('delay-300')}`}
          >
            Choose design access, AI credits, or both for your next textile workflow.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : plans.length === 0 ? (
          <div className="mx-auto max-w-xl border border-neutral-200 bg-white/60 p-8 text-center rounded-sm">
            <p className="text-sm text-neutral-500">Plans are not available right now.</p>
          </div>
        ) : (
          <div className={`grid gap-5 md:grid-cols-2 lg:grid-cols-3 transition-all duration-1000 ease-out ${animate('delay-450')}`}>
            {plans.map((plan) => {
              const isCombo = plan.planType === 'COMBO';
              const isPaying = payingPlanId === plan.id;

              return (
                <article
                  key={plan.id}
                  className={`rounded-sm border bg-white p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 ${
                    isCombo ? 'border-[#2A2623]' : 'border-neutral-200'
                  }`}
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">{plan.planType}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#2A2623]">{plan.name}</h3>
                    </div>
                    {isCombo && (
                      <span className="rounded-sm bg-[#2A2623] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                        Best Value
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <p className="text-4xl font-semibold text-[#2A2623]">{formatPlanPrice(plan.price)}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                      {plan.billingCycle.toLowerCase()}
                    </p>
                  </div>

                  <ul className="mb-8 space-y-3">
                    {getPlanBenefits(plan).map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3 text-sm text-neutral-600">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    onClick={() => void handleSubscribe(plan)}
                    disabled={payingPlanId !== null}
                    className="h-12 w-full rounded-sm bg-[#2A2623] text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-black"
                  >
                    {isPaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Subscribe
                  </Button>
                </article>
              );
            })}
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
