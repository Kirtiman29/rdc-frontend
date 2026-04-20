import { FormEvent, type ComponentProps, type ElementType, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarDays,
  Copy,
  CreditCard,
  KeyRound,
  Loader2,
  LogOut,
  Save,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  disableTwoFactor,
  getProfile,
  setupTwoFactor,
  updateProfile,
  verifyTwoFactor,
  type TwoFactorSetupResponse,
  type UpdateUserProfilePayload,
  type UserProfile,
} from '@/api/authApi';
import { getToken } from '@/api/apiClient';
import {
  EMPTY_SUBSCRIPTION_SUMMARY,
  formatSubscriptionDate,
  getMySubscription,
  getRemainingDesigns,
  hasActiveSubscription,
  type UserSubscriptionSummary,
} from '@/api/subscriptionApi';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const OTP_LENGTH = 6;

type ApiErrorLike = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
};

const getApiStatus = (error: unknown) => (error as ApiErrorLike)?.response?.status;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const data = (error as ApiErrorLike)?.response?.data;
  return data?.message || data?.error || fallback;
};

const getDisplayName = (profile?: UserProfile | null) => {
  return profile?.displayName || profile?.name || profile?.email?.split('@')[0] || 'Studio User';
};

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : value.slice(0, 2);
  return initials.toUpperCase() || 'AI';
};

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionSummary>(EMPTY_SUBSCRIPTION_SUMMARY);
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    oldPassword: '',
    newPassword: '',
  });
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const displayName = useMemo(() => getDisplayName(profile), [profile]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const remainingDesigns = getRemainingDesigns(subscription);
  const subscriptionActive = hasActiveSubscription(subscription);

  const syncProfile = useCallback(async () => {
    const data = await getProfile();
    setProfile(data);
    setForm({
      displayName: getDisplayName(data),
      email: data.email || '',
      oldPassword: '',
      newPassword: '',
    });
  }, []);

  const syncSubscription = useCallback(async () => {
    try {
      const summary = await getMySubscription();
      setSubscription(summary);
    } catch (error) {
      console.warn('Subscription summary unavailable:', error);
      setSubscription(EMPTY_SUBSCRIPTION_SUMMARY);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!getToken()) {
        navigate('/login');
        return;
      }

      try {
        await Promise.all([syncProfile(), syncSubscription()]);
      } catch (error: unknown) {
        const status = getApiStatus(error);

        if (status === 401 || status === 403) {
          logout();
          return;
        }

        toast({
          variant: 'destructive',
          title: 'Profile unavailable',
          description: 'AI Studio could not load your account details right now.',
        });
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [logout, navigate, syncProfile, syncSubscription]);

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();

    if (form.newPassword && !form.oldPassword) {
      toast({
        variant: 'destructive',
        title: 'Current password required',
        description: 'Enter your current password before setting a new one.',
      });
      return;
    }

    const payload: UpdateUserProfilePayload = {};

    if (form.displayName.trim() && form.displayName.trim() !== getDisplayName(profile)) {
      payload.displayName = form.displayName.trim();
    }

    if (form.email.trim() && form.email.trim() !== profile?.email) {
      payload.email = form.email.trim();
    }

    if (form.newPassword) {
      payload.oldPassword = form.oldPassword;
      payload.newPassword = form.newPassword;
    }

    if (Object.keys(payload).length === 0) {
      toast({ title: 'Nothing to update', description: 'Your AI Studio profile is already current.' });
      return;
    }

    setSaving(true);

    try {
      await updateProfile(payload);
      await syncProfile();
      toast({
        title: 'Profile saved',
        description: payload.email ? 'Verify the new email address before your next secure action.' : 'Your Studio account is updated.',
      });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: getApiErrorMessage(error, 'Please check your details and try again.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetupTwoFactor = async () => {
    setSecurityLoading(true);

    try {
      const setup = await setupTwoFactor();
      setTwoFactorSetup(setup);
      setVerifyCode('');
      toast({
        title: '2FA secret generated',
        description: 'Add it to your authenticator app, then enter the first code.',
      });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Could not start 2FA setup',
        description: getApiErrorMessage(error, 'Try again in a moment.'),
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (verifyCode.length !== OTP_LENGTH) {
      toast({
        variant: 'destructive',
        title: 'Enter complete code',
        description: 'Use the 6-digit code from your authenticator app.',
      });
      return;
    }

    setSecurityLoading(true);

    try {
      const response = await verifyTwoFactor(verifyCode);

      if (!response.valid) {
        throw new Error('Invalid authenticator code');
      }

      await syncProfile();
      setTwoFactorSetup(null);
      setVerifyCode('');
      toast({ title: '2FA enabled', description: 'Studio sign-ins now require authenticator verification.' });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: getApiErrorMessage(error, error instanceof Error ? error.message : 'Enter a fresh code and try again.'),
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (disableCode.length !== OTP_LENGTH) {
      toast({
        variant: 'destructive',
        title: 'Enter complete code',
        description: 'Use the 6-digit code from your authenticator app.',
      });
      return;
    }

    setSecurityLoading(true);

    try {
      await disableTwoFactor(disableCode);
      await syncProfile();
      setDisableCode('');
      toast({ title: '2FA disabled', description: 'Authenticator verification has been turned off.' });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Could not disable 2FA',
        description: getApiErrorMessage(error, 'Enter a fresh code and try again.'),
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const copySecret = async () => {
    if (!twoFactorSetup?.secret) return;
    try {
      await navigator.clipboard.writeText(twoFactorSetup.secret);
      toast({ title: 'Secret copied', description: 'Paste it into your authenticator app.' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy unavailable',
        description: 'Select the manual secret and copy it into your authenticator app.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#050505]">
        <Loader2 className="h-9 w-9 animate-spin text-[#ff1a1a]" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ff1a1a]/25 bg-[#ff1a1a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff5a5a]">
              <Sparkles className="h-3.5 w-3.5" />
              AI Studio Account
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Profile</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Manage your Studio identity, subscription credits, password, and authenticator security.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {subscriptionActive
                ? `${subscription.availableCredits || 0} AI credits available, ${remainingDesigns} design usages left.`
                : 'Choose a plan to unlock AI credits and premium design usage.'}
            </p>
          </div>

          <Button
            type="button"
            onClick={logout}
            className="h-11 rounded-lg border border-[#ff1a1a]/30 bg-[#ff1a1a]/10 px-5 text-[#ff5a5a] hover:bg-[#ff1a1a] hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>

        <section className="mb-6 rounded-lg border border-white/10 bg-[#0f0f0f] p-5 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-lg bg-gradient-to-br from-[#ff1a1a] to-[#801010] p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#0b0b0b] text-2xl font-bold text-white">
                  {initials}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{displayName}</h2>
                <p className="mt-1 text-sm text-gray-400">{profile?.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill active={Boolean(profile?.verified)} activeText="Verified" inactiveText="Email pending" icon={BadgeCheck} />
                  <StatusPill active={Boolean(profile?.twoFactorEnabled)} activeText="2FA active" inactiveText="2FA off" icon={ShieldCheck} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[430px]">
              <Metric icon={CreditCard} label="Plan" value={subscription.planName || 'None'} />
              <Metric icon={CalendarDays} label="Expires" value={formatSubscriptionDate(subscription.endDate)} />
              <Metric icon={KeyRound} label="Credits" value={`${subscription.availableCredits || 0}`} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="rounded-lg border border-white/10 bg-[#0f0f0f] p-5 md:p-6">
            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
              <User className="h-4 w-4 text-[#ff5a5a]" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">Profile Details</h2>
            </div>

            <form className="space-y-6" onSubmit={handleUpdate}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Display Name">
                  <StudioInput
                    value={form.displayName}
                    onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  />
                </Field>

                <Field label="Email Address">
                  <StudioInput
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </Field>
              </div>

              <div className="grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
                <Field label="Current Password">
                  <StudioInput
                    type="password"
                    value={form.oldPassword}
                    placeholder="Required for password changes"
                    onChange={(event) => setForm((current) => ({ ...current, oldPassword: event.target.value }))}
                  />
                </Field>

                <Field label="New Password">
                  <StudioInput
                    type="password"
                    value={form.newPassword}
                    placeholder="Leave blank to keep current password"
                    onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-lg bg-[#ff1a1a] px-5 text-sm font-semibold text-white hover:bg-[#d91414]"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
                <p className="text-xs text-gray-500">Email changes require fresh verification before secure account actions.</p>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0f0f0f] p-5 md:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Security</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Two-factor authentication</h2>
              </div>
              {profile?.twoFactorEnabled ? (
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              ) : (
                <ShieldOff className="h-6 w-6 text-gray-600" />
              )}
            </div>

            {profile?.twoFactorEnabled ? (
              <div className="space-y-5">
              <p className="text-sm leading-6 text-gray-400">
                  Studio password login is protected by a 6-digit authenticator code.
                </p>
                <StudioOtp value={disableCode} onChange={setDisableCode} />
                <Button
                  type="button"
                  disabled={securityLoading}
                  onClick={handleDisableTwoFactor}
                  className="h-11 w-full rounded-lg border border-[#ff1a1a]/30 bg-[#ff1a1a]/10 text-[#ff5a5a] hover:bg-[#ff1a1a] hover:text-white"
                >
                  {securityLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Disable 2FA
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm leading-6 text-gray-400">
                  Add a TOTP secret to your authenticator app, then verify the first code to activate 2FA.
                </p>

                {!twoFactorSetup ? (
                  <Button
                    type="button"
                    disabled={securityLoading}
                    onClick={handleSetupTwoFactor}
                    className="h-11 w-full rounded-lg bg-white text-black hover:bg-gray-200"
                  >
                    {securityLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate 2FA Secret
                  </Button>
                ) : (
                  <div className="space-y-5">
                    {twoFactorSetup.qrCodeImageUri && (
                      <div className="flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-white p-4">
                        <img
                          src={twoFactorSetup.qrCodeImageUri}
                          alt="Scan this QR code with your authenticator app"
                          width={180}
                          height={180}
                          className="h-[180px] w-[180px] rounded-lg"
                        />
                        <p className="text-center text-xs leading-5 text-gray-600">
                          Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator.
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Manual Secret</p>
                          <p className="mt-2 break-all font-mono text-sm text-white">{twoFactorSetup.secret}</p>
                        </div>
                        <button
                          type="button"
                          onClick={copySecret}
                          className="rounded-lg border border-white/10 p-2 text-gray-400 transition-colors hover:text-white"
                          aria-label="Copy 2FA secret"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <StudioOtp value={verifyCode} onChange={setVerifyCode} />

                    <Button
                      type="button"
                      disabled={securityLoading}
                      onClick={handleVerifyTwoFactor}
                      className="h-11 w-full rounded-lg bg-[#ff1a1a] text-white hover:bg-[#d91414]"
                    >
                      {securityLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify & Enable
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{label}</label>
    {children}
  </div>
);

const StudioInput = (props: ComponentProps<typeof Input>) => (
  <Input
    {...props}
    className={`h-11 rounded-lg border-white/10 bg-white/[0.04] text-white placeholder:text-gray-600 focus-visible:ring-[#ff1a1a]/60 ${props.className || ''}`}
  />
);

const StudioOtp = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <InputOTP maxLength={OTP_LENGTH} value={value} onChange={onChange} containerClassName="justify-center" pattern="^[0-9]+$">
    <InputOTPGroup>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <InputOTPSlot
          key={index}
          index={index}
          className="border-white/10 bg-white/[0.04] text-white first:rounded-l-lg last:rounded-r-lg"
        />
      ))}
    </InputOTPGroup>
  </InputOTP>
);

const StatusPill = ({
  active,
  activeText,
  inactiveText,
  icon: Icon,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
  icon: ElementType;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
      active ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/[0.03] text-gray-500'
    }`}
  >
    <Icon className="h-3.5 w-3.5" />
    {active ? activeText : inactiveText}
  </span>
);

const Metric = ({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">{label}</p>
      <Icon className="h-3.5 w-3.5 text-[#ff5a5a]" />
    </div>
    <p className="truncate text-sm font-semibold text-white">{value}</p>
  </div>
);
