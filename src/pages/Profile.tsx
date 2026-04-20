import { FormEvent, type ElementType, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarDays,
  Copy,
  CreditCard,
  KeyRound,
  Loader2,
  LogOut,
  ShieldCheck,
  ShieldOff,
  User,
} from 'lucide-react';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
import { useToast } from '@/hooks/use-toast';

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
  return profile?.displayName || profile?.name || profile?.email?.split('@')[0] || 'RDC Partner';
};

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'U';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    const fetchUserData = async () => {
      if (!getToken()) {
        navigate('/login');
        return;
      }

      try {
        await Promise.all([syncProfile(), syncSubscription()]);
      } catch (error: unknown) {
        console.error('Profile sync failed:', error);

        const status = getApiStatus(error);

        if (status === 401 || status === 403) {
          logout();
          return;
        }

        toast({
          variant: 'destructive',
          title: 'Profile unavailable',
          description: 'We could not load your RDC account details right now.',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchUserData();
  }, [navigate, logout, toast, syncProfile, syncSubscription]);

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
      toast({ title: 'Nothing to update', description: 'Your profile is already up to date.' });
      return;
    }

    setSaving(true);

    try {
      await updateProfile(payload);
      await syncProfile();
      toast({
        title: 'Profile updated',
        description: payload.email ? 'Please verify your new email address to keep checkout access active.' : 'Your account details were saved.',
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
        description: 'Add the secret to your authenticator app, then verify the 6-digit code.',
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
      toast({ title: '2FA enabled', description: 'Your RDC account now requires authenticator verification.' });
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
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-sm bg-[#2A2623] text-white flex items-center justify-center text-3xl font-semibold shadow-sm">
                {getInitial(displayName)}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold text-[#2A2623]">{displayName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className={`h-4 w-4 ${profile?.verified ? 'text-emerald-600' : 'text-amber-600'}`} />
                    {profile?.verified ? 'Verified account' : 'Email verification pending'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className={`h-4 w-4 ${profile?.twoFactorEnabled ? 'text-emerald-600' : 'text-zinc-400'}`} />
                    {profile?.twoFactorEnabled ? '2FA enabled' : '2FA available'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="h-11 rounded-sm text-destructive hover:text-white hover:bg-destructive uppercase text-[10px] font-bold tracking-[0.2em]"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <SummaryTile icon={CreditCard} label="Plan" value={subscription.planName || 'No active plan'} detail={subscriptionActive ? `${subscription.planType} ${subscription.billingCycle}` : 'Choose a plan to unlock access'} />
            <SummaryTile icon={CalendarDays} label="Expires" value={formatSubscriptionDate(subscription.endDate)} detail={subscription.status || 'No active subscription'} />
            <SummaryTile icon={KeyRound} label="Credits" value={`${subscription.availableCredits || 0}`} detail={`${remainingDesigns}/${subscription.designLimit || 0} design usages left`} />
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="bg-background border border-border p-6 md:p-8 shadow-sm rounded-sm">
              <div className="mb-8 flex items-center gap-3 border-b border-border pb-5">
                <User className="h-4 w-4 text-[#2A2623]" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#2A2623]">Account Profile</h2>
              </div>

              <form className="space-y-7" onSubmit={handleUpdate}>
                <div className="grid md:grid-cols-2 gap-6">
                  <Field label="Display Name">
                    <Input
                      value={form.displayName}
                      onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                      className="h-12 rounded-sm"
                    />
                  </Field>

                  <Field label="Email Address">
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="h-12 rounded-sm"
                    />
                  </Field>
                </div>

                <div className="grid md:grid-cols-2 gap-6 border-t border-border pt-7">
                  <Field label="Current Password">
                    <Input
                      type="password"
                      value={form.oldPassword}
                      onChange={(event) => setForm((current) => ({ ...current, oldPassword: event.target.value }))}
                      placeholder="Required for password changes"
                      className="h-12 rounded-sm"
                    />
                  </Field>

                  <Field label="New Password">
                    <Input
                      type="password"
                      value={form.newPassword}
                      onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                      placeholder="Leave blank to keep current password"
                      className="h-12 rounded-sm"
                    />
                  </Field>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-12 rounded-sm bg-[#2A2623] hover:bg-black uppercase text-[10px] font-bold tracking-[0.2em]"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Profile
                  </Button>
                  <p className="text-xs text-muted-foreground sm:max-w-md">
                    Changing your email marks the account unverified until the new verification email is confirmed.
                  </p>
                </div>
              </form>
            </section>

            <section className="bg-background border border-border p-6 md:p-8 shadow-sm rounded-sm h-fit">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Security</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#2A2623]">Two-factor authentication</h2>
                </div>
                {profile?.twoFactorEnabled ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                ) : (
                  <ShieldOff className="h-6 w-6 text-zinc-400" />
                )}
              </div>

              {profile?.twoFactorEnabled ? (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Your account requires a fresh 6-digit authenticator code during password login.
                  </p>
                  <OtpInput value={disableCode} onChange={setDisableCode} />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={securityLoading}
                    onClick={handleDisableTwoFactor}
                    className="h-11 w-full rounded-sm border-destructive text-destructive hover:bg-destructive hover:text-white uppercase text-[10px] font-bold tracking-[0.2em]"
                  >
                    {securityLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Disable 2FA
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Generate a TOTP secret, add it to your authenticator app, then verify the first code to enable 2FA.
                  </p>

                  {!twoFactorSetup ? (
                    <Button
                      type="button"
                      disabled={securityLoading}
                      onClick={handleSetupTwoFactor}
                      className="h-11 w-full rounded-sm bg-[#2A2623] hover:bg-black uppercase text-[10px] font-bold tracking-[0.2em]"
                    >
                      {securityLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate 2FA Secret
                    </Button>
                  ) : (
                    <div className="space-y-5">
                      {twoFactorSetup.qrCodeImageUri && (
                        <div className="flex flex-col items-center gap-3 rounded-sm border border-border bg-white p-4">
                          <img
                            src={twoFactorSetup.qrCodeImageUri}
                            alt="Scan this QR code with your authenticator app"
                            width={180}
                            height={180}
                            className="h-[180px] w-[180px] rounded-sm"
                          />
                          <p className="text-center text-xs text-muted-foreground">
                            Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator.
                          </p>
                        </div>
                      )}

                      <div className="rounded-sm border border-dashed bg-secondary/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manual Secret</p>
                            <p className="mt-1 break-all font-mono text-sm text-[#2A2623]">{twoFactorSetup.secret}</p>
                          </div>
                          <button
                            type="button"
                            onClick={copySecret}
                            className="shrink-0 rounded-sm border border-border p-2 text-muted-foreground hover:text-[#2A2623]"
                            aria-label="Copy 2FA secret"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <OtpInput value={verifyCode} onChange={setVerifyCode} />

                      <Button
                        type="button"
                        disabled={securityLoading}
                        onClick={handleVerifyTwoFactor}
                        className="h-11 w-full rounded-sm bg-[#2A2623] hover:bg-black uppercase text-[10px] font-bold tracking-[0.2em]"
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
      </main>
      <Footer />
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground block">{label}</label>
    {children}
  </div>
);

const OtpInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <InputOTP maxLength={OTP_LENGTH} value={value} onChange={onChange} containerClassName="justify-center" pattern="^[0-9]+$">
    <InputOTPGroup>
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} />
      <InputOTPSlot index={2} />
      <InputOTPSlot index={3} />
      <InputOTPSlot index={4} />
      <InputOTPSlot index={5} />
    </InputOTPGroup>
  </InputOTP>
);

const SummaryTile = ({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ElementType;
  label: string;
  value: string;
  detail: string;
}) => (
  <div className="rounded-sm border border-border bg-background p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-lg font-semibold text-[#2A2623]">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <Icon className="h-5 w-5 text-[#2A2623]" />
    </div>
  </div>
);

export default Profile;
