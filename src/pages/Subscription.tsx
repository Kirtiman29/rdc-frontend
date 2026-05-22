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
  getRemainingDesigns,
  getMySubscription,
  getPlans,
  hasActiveSubscription,
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
    case 'AI':
      return 0;
    case 'DESIGN':
      return 1;
    case 'COMBO':
      return 2;
    default:
      return 3;
  }
};

const getPlanHeading = (plan: SubscriptionPlan) => plan.name;

const getPlanDescription = (plan: SubscriptionPlan) => {
  switch (plan.planType) {
    case 'AI':
      return `${plan.creditLimit} AI credits for generation, recoloring, color separation, upscale, and rapid experimentation.`;
    case 'DESIGN':
      return `${plan.designLimit} downloadable premium textile designs for sourcing, approvals, and collection planning.`;
    case 'COMBO':
      return `${plan.designLimit} design usages and ${plan.creditLimit} AI credits in one connected workflow.`;
    default:
      return 'Flexible subscription access for your textile workflow.';
  }
};

const getPlanBenefits = (plan: SubscriptionPlan) => {
  const benefits: string[] = [];

  if (plan.designLimit > 0) {
    benefits.push(`${plan.designLimit} premium design usages included`);
  }

  if (plan.creditLimit > 0) {
    benefits.push(`${plan.creditLimit} AI credits included`);
  }

  if (plan.pricePerDesign !== null && plan.pricePerDesign > 0) {
    benefits.push(`${formatPlanPrice(plan.pricePerDesign)} per design effective rate`);
  }

  if (plan.planType === 'COMBO') {
    benefits.push('Unified access across design and AI');
  }

  benefits.push('Single account access');
  benefits.push(`${plan.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'} renewal`);

  return benefits;
};

const getPlanMetricLabel = (plan: SubscriptionPlan) => {
  if (plan.planType === 'AI') {
    return 'Credits per cycle';
  }

  if (plan.planType === 'DESIGN') {
    return 'Designs per cycle';
  }

  return 'Included usage';
};

const getPlanMetricValue = (plan: SubscriptionPlan) => {
  if (plan.planType === 'AI') {
    return `${plan.creditLimit} Credits`;
  }

  if (plan.planType === 'DESIGN') {
    return `${plan.designLimit} Designs`;
  }

  return `${plan.designLimit} Designs + ${plan.creditLimit} Credits`;
};

const getPlanSelectorLabel = (planType: PlanType, plan: SubscriptionPlan) => {
  if (planType === 'AI') {
    return `${plan.creditLimit}`;
  }

  if (planType === 'DESIGN') {
    return `${plan.designLimit}`;
  }

  if (plan.designLimit > 0 && plan.creditLimit > 0) {
    return `${plan.designLimit}D / ${plan.creditLimit}C`;
  }

  return plan.name;
};

const getPlanSelectorHeading = (planType: PlanType, billingCycle: BillingCycle) => {
  const cycleUnit = billingCycle === 'MONTHLY' ? 'month' : 'year';

  if (planType === 'AI') {
    return `AI credits per ${cycleUnit}`;
  }

  if (planType === 'DESIGN') {
    return `Design downloads per ${cycleUnit}`;
  }

  return `Included usage per ${cycleUnit}`;
};

const getPlanRecordScore = (planType: PlanType, plan: SubscriptionPlan) => {
  let score = 0;

  if (plan.price > 0) {
    score += 1;
  }

  if (plan.designLimit > 0) {
    score += 1;
  }

  if (plan.creditLimit > 0) {
    score += 1;
  }

  if (planType === 'DESIGN' && plan.pricePerDesign !== null && plan.pricePerDesign > 0) {
    score += 4;
  }

  return score;
};

const dedupePlansBySelectorLabel = (planType: PlanType, plans: SubscriptionPlan[]) => {
  const selectedPlans = new Map<string, SubscriptionPlan>();

  for (const plan of plans) {
    const label = getPlanSelectorLabel(planType, plan);
    const existing = selectedPlans.get(label);

    if (!existing) {
      selectedPlans.set(label, plan);
      continue;
    }

    const existingScore = getPlanRecordScore(planType, existing);
    const nextScore = getPlanRecordScore(planType, plan);

    if (nextScore > existingScore || (nextScore === existingScore && plan.id > existing.id)) {
      selectedPlans.set(label, plan);
    }
  }

  return Array.from(selectedPlans.values());
};

const getPlanTypeSectionCopy = (planType: PlanType) => {
  switch (planType) {
    case 'AI':
      return {
        title: 'AI Credit Plans',
        description:
          'Choose the monthly credit pack that fits your generation, recolor, color separation, and refinement workload.',
        bullets: [
          'Access generation, recolor, color separation, and upscale tools',
          'Credits scale with the amount of studio work your team needs',
          'Single seat access for one account',
        ],
      };
    case 'DESIGN':
      return {
        title: 'Design Access Plans',
        description:
          'Choose the monthly design allowance that fits your download volume and sourcing workflow.',
        bullets: [
          'Download from the premium textile design library',
          'Standard license for creative digital and print use',
          'Single seat access for one account',
        ],
      };
    case 'COMBO':
      return {
        title: 'Combo Plans',
        description:
          'Combined access for teams that need both premium designs and AI credits in one subscription.',
        bullets: [
          'Design library access and AI studio usage in one plan',
          'Built for teams running sourcing and concept workflows together',
          'Single seat access for one account',
        ],
      };
    default:
      return {
        title: 'Plans',
        description: 'Subscription options returned by the backend.',
        bullets: ['Single account access'],
      };
  }
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
  const [subscription, setSubscription] = useState<UserSubscriptionSummary>(
    EMPTY_SUBSCRIPTION_SUMMARY
  );
  const [selectedPlanIds, setSelectedPlanIds] = useState<Record<string, number>>({});

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
  const visiblePlanGroups = (['AI', 'DESIGN', 'COMBO'] as PlanType[])
    .map((planType) => ({
      planType,
      plans: dedupePlansBySelectorLabel(
        planType,
        visiblePlans.filter((plan) => plan.planType === planType)
      ),
    }))
    .filter((group) => group.plans.length > 0);
  const activeSubscription = hasActiveSubscription(subscription);
  const remainingDesigns = getRemainingDesigns(subscription);
  const copy = cycleCopy[selectedCycle];

  useEffect(() => {
    setSelectedPlanIds((current) => {
      let changed = false;
      const next = { ...current };

      for (const group of visiblePlanGroups) {
        const key = `${selectedCycle}-${group.planType}`;
        const selectedId = current[key];
        const hasSelectedPlan = group.plans.some((plan) => plan.id === selectedId);
        const activePlanInGroup = group.plans.find((plan) => plan.id === subscription.planId);
        const fallbackPlan = activePlanInGroup || group.plans[0];

        if (!hasSelectedPlan && fallbackPlan) {
          next[key] = fallbackPlan.id;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [selectedCycle, subscription.planId, visiblePlanGroups]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!getToken()) {
      navigate('/login', { state: { from: `/checkout?planId=${plan.id}` } });
      return;
    }

    navigate(`/checkout?planId=${plan.id}`);
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
                    Design requests left: {remainingDesigns} · Credits left: {subscription.availableCredits || 0} · Valid until{' '}
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
                {visiblePlanGroups.map((group) => {
                  const section = getPlanTypeSectionCopy(group.planType);
                  const selectionKey = `${selectedCycle}-${group.planType}`;
                  const selectedPlan =
                    group.plans.find((plan) => plan.id === selectedPlanIds[selectionKey]) ||
                    group.plans[0];
                  const isFeatured = group.planType === 'COMBO';
                  const isActivePlan =
                    activeSubscription && subscription.planId === selectedPlan?.id;
                  const cycleText = selectedCycle === 'MONTHLY' ? 'month' : 'year';
                  const cycleBillingCopy =
                    selectedCycle === 'MONTHLY'
                      ? 'Billed monthly. Cancel or upgrade anytime.'
                      : 'Billed yearly for uninterrupted access.';

                  if (!selectedPlan) {
                    return null;
                  }

                  return (
                    <section key={group.planType} className="h-full">
                      <article
                        className={`relative flex h-full flex-col rounded-[28px] border bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8 ${
                          isFeatured
                            ? 'border-[#FF6A4D] shadow-[0_20px_60px_rgba(186,27,28,0.12)]'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#F7F1E9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                              {group.planType}
                            </span>
                            {isFeatured && (
                              <span className="rounded-full bg-[#FFE3DE] px-3 py-1 text-[10px] font-bold text-[#BA1B1C]">
                                Best Value
                              </span>
                            )}
                            {isActivePlan && (
                              <span className="rounded-full bg-[#EEF7F1] px-3 py-1 text-[10px] font-bold text-[#2D7A46]">
                                Active
                              </span>
                            )}
                          </div>

                          <Sparkles
                            className={`h-5 w-5 ${
                              isFeatured ? 'text-[#BA1B1C]' : 'text-slate-400'
                            }`}
                          />
                        </div>

                        <div className="mt-7">
                          <h3 className="text-[30px] font-semibold leading-tight text-slate-950">
                            {section.title}
                          </h3>
                          <p className="mt-3 max-w-2xl text-[17px] leading-7 text-slate-600">
                            {section.description}
                          </p>
                        </div>

                        <ul className="mt-7 space-y-3">
                          {section.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex items-start gap-3 text-base leading-6 text-slate-800"
                            >
                              <Check className="mt-1 h-4 w-4 shrink-0 text-slate-900" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-12">
                          <p className="text-lg font-medium text-slate-900">
                            {getPlanSelectorHeading(group.planType, selectedCycle)}
                          </p>
                          <div
                            className="mt-4 grid rounded-2xl border border-slate-300 bg-white p-1"
                            style={{
                              gridTemplateColumns: `repeat(${group.plans.length}, minmax(0, 1fr))`,
                            }}
                          >
                            {group.plans.map((plan) => {
                              const isSelected = plan.id === selectedPlan.id;

                              return (
                                <button
                                  key={plan.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedPlanIds((current) => ({
                                      ...current,
                                      [selectionKey]: plan.id,
                                    }))
                                  }
                                  className={`w-full min-w-0 rounded-[14px] px-2 py-2 text-sm font-medium transition-all md:px-3 md:text-base ${
                                    isSelected
                                      ? 'border border-slate-900 bg-white text-slate-950 shadow-sm'
                                      : 'border border-transparent text-slate-600 hover:text-slate-950'
                                  }`}
                                >
                                  {getPlanSelectorLabel(group.planType, plan)}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-4 min-h-[20px]">
                            {selectedPlan.pricePerDesign !== null &&
                              selectedPlan.pricePerDesign > 0 && (
                                <p className="text-sm text-slate-600">
                                  Effective rate: {formatPlanPrice(selectedPlan.pricePerDesign)} per
                                  design
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="mt-12 flex min-h-[116px] flex-col justify-center rounded-[20px] bg-[#FCFAF7] p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {getPlanMetricLabel(selectedPlan)}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">
                            {getPlanMetricValue(selectedPlan)}
                          </p>
                        </div>

                        <div className="mt-8 flex items-end gap-1 text-slate-950">
                          <span className="text-5xl font-semibold">
                            {formatPlanPrice(selectedPlan.price)}
                          </span>
                          <span className="mb-2 text-base font-medium text-slate-700">
                            /{cycleText}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-5 text-slate-600">
                          {cycleBillingCopy}
                        </p>

                        <Button
                          type="button"
                          onClick={() => void handleSubscribe(selectedPlan)}
                          className={`mt-8 h-14 w-full rounded-[16px] text-base font-semibold transition-colors ${
                            isFeatured
                              ? 'bg-[#1A1A1A] text-white hover:bg-[#BA1B1C]'
                              : 'border border-slate-300 bg-white text-slate-950 hover:bg-slate-50'
                          }`}
                        >
                          <Wand2 className="mr-2 h-4 w-4" />
                          {isActivePlan ? 'Subscribed' : 'Subscribe'}
                        </Button>
                      </article>
                    </section>
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
