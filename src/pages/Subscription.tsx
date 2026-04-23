import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2, Sparkles, Wand2 } from 'lucide-react';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getToken } from '@/api/apiClient';
import {
  EMPTY_SUBSCRIPTION_SUMMARY,
  formatPlanPrice,
  formatSubscriptionDate,
  getMySubscription,
  getPlans,
  hasActiveSubscription,
  initiateSubscriptionPayment,
  openSubscriptionCheckout,
  verifySubscriptionPayment,
  type BillingCycle,
  type PlanType,
  type SubscriptionPlan,
  type UserSubscriptionSummary,
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

const getPlanOrder = (planType: PlanType) => {
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

const getPlanHeading = (plan: SubscriptionPlan) => {
  switch (plan.planType) {
    case 'DESIGN':
      return 'Premium design subscription';
    case 'AI':
      return 'AI studio subscription';
    case 'COMBO':
      return 'Complete RDC subscription';
    default:
      return plan.name;
  }
};

const getPlanDescription = (plan: SubscriptionPlan) => {
  switch (plan.planType) {
    case 'DESIGN':
      return 'Curated premium textile designs for sourcing and collection planning.';
    case 'AI':
      return 'AI credits for generation, recoloring, upscale, and fast concept development.';
    case 'COMBO':
      return 'Premium design access and AI production tools in one workflow.';
    default:
      return 'Flexible subscription access for your textile workflow.';
  }
};

const getPlanBenefits = (plan: SubscriptionPlan) => {
  const benefits = [];

  if (plan.planType === 'DESIGN' || plan.planType === 'COMBO') {
    benefits.push(`${plan.designLimit} premium design usages included`);
  }

  if (plan.planType === 'AI' || plan.planType === 'COMBO') {
    benefits.push(`${plan.creditLimit} AI credits included`);
  }

  if (plan.planType === 'COMBO') {
    benefits.push('Unified access across design and AI');
  }

  benefits.push('Single account access');
  benefits.push(`${plan.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'} renewal`);

  return benefits;
};

const getPlanMetricLabel = (plan: SubscriptionPlan) => {
  if (plan.planType === 'DESIGN') {
    return 'Designs per cycle';
  }

  if (plan.planType === 'AI') {
    return 'Credits per cycle';
  }

  return 'Access level';
};

const cycleCopy: Record<
  BillingCycle,
  { eyebrow: string; headline: string; body: string; note: string }
> = {
  MONTHLY: {
    eyebrow: 'No long lock-in',
    headline: 'Flexible monthly plans for active studio work',
    body:
      'Choose monthly access when you want room to experiment, launch a new workflow, or keep things flexible between collections.',
    note: 'Best for short-term production cycles and testing new workflows.',
  },
  YEARLY: {
    eyebrow: 'Commit and save',
    headline: 'Yearly plans for uninterrupted production',
    body:
      'Choose yearly access when your team needs stable design usage and AI credits across seasons, launches, and repeat client work.',
    note: 'Best for long-term teams and repeat production schedules.',
  },
};

const Subscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('MONTHLY');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionSummary>(
    EMPTY_SUBSCRIPTION_SUMMARY
  );

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await getPlans();
        setPlans(response);

        const hasMonthly = response.some((plan) => plan.billingCycle === 'MONTHLY');
        const hasYearly = response.some((plan) => plan.billingCycle === 'YEARLY');

        if (!hasMonthly && hasYearly) {
          setSelectedCycle('YEARLY');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Plans unavailable',
          description: getApiErrorMessage(
            error,
            'Subscription plans could not be loaded.'
          ),
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPlans();
  }, [toast]);

  useEffect(() => {
    if (!getToken()) {
      setSubscription(EMPTY_SUBSCRIPTION_SUMMARY);
      return;
    }

    const loadSubscription = async () => {
      try {
        const summary = await getMySubscription();
        setSubscription(summary);
      } catch (error) {
        console.warn('Subscription summary unavailable:', error);
        setSubscription(EMPTY_SUBSCRIPTION_SUMMARY);
      }
    };

    void loadSubscription();
  }, []);

  const monthlyPlans = plans.filter((plan) => plan.billingCycle === 'MONTHLY');
  const yearlyPlans = plans.filter((plan) => plan.billingCycle === 'YEARLY');
  const visiblePlans = [...plans.filter((plan) => plan.billingCycle === selectedCycle)].sort(
    (first, second) => getPlanOrder(first.planType) - getPlanOrder(second.planType)
  );
  const activeSubscription = hasActiveSubscription(subscription);
  const copy = cycleCopy[selectedCycle];

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!getToken()) {
      navigate('/login', { state: { from: '/subscription' } });
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

          try {
            const summary = await getMySubscription();
            setSubscription(summary);
          } catch (error) {
            console.warn('Subscription summary refresh failed:', error);
          }

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
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900">
      <Header />

      <main className="overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(186,27,28,0.08),_transparent_30%),linear-gradient(180deg,_#FDFCFB_0%,_#FBF8F4_48%,_#F7F1E9_100%)]">
        <section className="relative px-6 pb-12 pt-16 md:px-10 md:pb-16 md:pt-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_center,_rgba(186,27,28,0.10),_transparent_58%)]" />

          <div className="relative mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BA1B1C]/10 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#BA1B1C] shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                RDC Plans
              </div>

              <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                Unlock the right plan for your design studio
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                Choose monthly or yearly access for premium designs, AI tools, or a
                combined workflow that matches how your team actually works.
              </p>
            </div>

          </div>
        </section>

        {activeSubscription && (
          <section className="px-6 pb-4 md:px-10">
            <div className="mx-auto max-w-6xl rounded-[28px] border border-[#BA1B1C]/10 bg-white/85 p-6 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#BA1B1C]">
                    Active Subscription
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {subscription.planName || 'Current plan'}
                    {subscription.billingCycle ? ` · ${subscription.billingCycle}` : ''}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Credits left: {subscription.availableCredits || 0} · Valid until{' '}
                    {formatSubscriptionDate(subscription.endDate)}
                  </p>
                </div>

                <Link
                  to="/profile"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#1A1A1A] px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5 hover:bg-[#BA1B1C]"
                >
                  Manage Plan
                </Link>
              </div>
            </div>
          </section>
        )}

        <section id="plan-grid" className="px-6 pb-14 pt-8 md:px-10 md:pb-20 md:pt-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#BA1B1C]">
                {copy.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                {copy.headline}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
                {copy.body}
              </p>
              <p className="mt-3 text-sm text-slate-600">{copy.note}</p>
            </div>

            <div className="mb-10 flex justify-center">
              <div className="inline-flex rounded-2xl border border-slate-300 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSelectedCycle('MONTHLY')}
                  disabled={monthlyPlans.length === 0}
                  className={`min-w-[160px] rounded-[12px] px-6 py-3 text-sm font-semibold transition-all ${
                    selectedCycle === 'MONTHLY'
                      ? 'bg-[#1A1A1A] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  } ${monthlyPlans.length === 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCycle('YEARLY')}
                  disabled={yearlyPlans.length === 0}
                  className={`min-w-[160px] rounded-[12px] px-6 py-3 text-sm font-semibold transition-all ${
                    selectedCycle === 'YEARLY'
                      ? 'bg-[#1A1A1A] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  } ${yearlyPlans.length === 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-[32px] border border-slate-200 bg-white/80">
                <Loader2 className="h-8 w-8 animate-spin text-[#BA1B1C]" />
              </div>
            ) : visiblePlans.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
                <p className="text-lg font-semibold text-slate-900">
                  No {selectedCycle.toLowerCase()} plans are available right now.
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Switch billing cycle or add plans in the backend to populate this
                  page.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-3">
                {visiblePlans.map((plan) => {
                  const isFeatured = plan.planType === 'COMBO';
                  const isActivePlan = activeSubscription && subscription.planId === plan.id;
                  const isPaying = payingPlanId === plan.id;
                  const cycleText = selectedCycle === 'MONTHLY' ? 'month' : 'year';
                  const cycleBillingCopy =
                    selectedCycle === 'MONTHLY'
                      ? 'Billed monthly. Cancel or upgrade anytime.'
                      : 'Billed yearly for uninterrupted access.';

                  return (
                    <article
                      key={plan.id}
                      className={`relative flex h-full flex-col overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 ${
                        isFeatured
                          ? 'border-[#FF6A4D] shadow-[0_20px_60px_rgba(186,27,28,0.12)]'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {isFeatured && (
                            <span className="rounded-full bg-[#FFE3DE] px-3 py-1 text-[10px] font-bold text-[#BA1B1C]">
                              New
                            </span>
                          )}
                          {isActivePlan && (
                            <span className="rounded-full bg-[#EEF7F1] px-3 py-1 text-[10px] font-bold text-[#2D7A46]">
                              Active
                            </span>
                          )}
                        </div>

                        <Sparkles
                          className={`h-4 w-4 ${isFeatured ? 'text-[#BA1B1C]' : 'text-slate-400'}`}
                        />
                      </div>

                      <div className="mt-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {plan.planType}
                        </p>
                        <h3 className="mt-3 text-[28px] font-semibold leading-tight text-slate-950">
                          {getPlanHeading(plan)}
                        </h3>
                        <p className="mt-3 text-[15px] leading-6 text-slate-600">
                          {getPlanDescription(plan)}
                        </p>
                      </div>

                      <ul className="mt-5 space-y-2.5">
                        {getPlanBenefits(plan).map((benefit) => (
                          <li
                            key={benefit}
                            className="flex items-start gap-3 text-sm leading-5 text-slate-700"
                          >
                            <Check
                              className={`mt-1 h-4 w-4 shrink-0 ${
                                isFeatured ? 'text-[#BA1B1C]' : 'text-slate-800'
                              }`}
                            />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6">
                        <p className="text-sm font-medium text-slate-700">
                          {selectedCycle === 'MONTHLY'
                            ? 'Usage each month'
                            : 'Usage each year'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {plan.designLimit > 0 && (
                            <span className="rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                              {plan.designLimit} designs
                            </span>
                          )}
                          {plan.creditLimit > 0 && (
                            <span className="rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                              {plan.creditLimit} credits
                            </span>
                          )}
                          {plan.planType === 'COMBO' && (
                            <span className="rounded-[10px] border border-[#FFD0C7] bg-[#FFF4F1] px-3 py-2 text-sm font-semibold text-[#BA1B1C]">
                              Best value
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto pt-7">
                        <div className="rounded-[18px] bg-[#FCFAF7] p-3.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {getPlanMetricLabel(plan)}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">
                            {plan.planType === 'COMBO'
                              ? 'Design + AI'
                              : plan.planType === 'DESIGN'
                                ? plan.designLimit
                                : plan.creditLimit}
                          </p>
                        </div>

                        <div className="mt-8 flex items-end gap-1 text-slate-950">
                          <span className="text-5xl font-semibold">
                            {formatPlanPrice(plan.price)}
                          </span>
                          <span className="mb-2 text-base font-medium text-slate-700">
                            /{cycleText}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-5 text-slate-600">{cycleBillingCopy}</p>

                        <Button
                          type="button"
                          onClick={() => void handleSubscribe(plan)}
                          disabled={payingPlanId !== null}
                          className={`mt-6 h-12 w-full rounded-[14px] text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                            isFeatured
                              ? 'bg-[#1A1A1A] text-white hover:bg-[#BA1B1C]'
                              : 'border border-slate-300 bg-white text-slate-950 hover:bg-slate-50'
                          }`}
                        >
                          {isPaying ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                          )}
                          {isActivePlan
                            ? 'Subscribed'
                            : isFeatured
                              ? 'Subscribe & Save'
                              : 'Subscribe'}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-10 rounded-[28px] border border-slate-200 bg-white/80 px-6 py-5 text-center shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
              <p className="text-sm text-slate-600">Prices shown in INR. Taxes may apply.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/ai-studio"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900 transition-all hover:-translate-y-0.5 hover:border-[#BA1B1C]/20"
                >
                  Explore AI Studio
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={getToken() ? '/profile' : '/login'}
                  className="inline-flex items-center gap-2 rounded-full bg-[#BA1B1C] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#8E1415]"
                >
                  {getToken() ? 'Open My Account' : 'Login To Subscribe'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Subscription;
