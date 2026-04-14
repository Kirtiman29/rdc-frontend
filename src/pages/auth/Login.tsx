import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';

import { loginUser, loginWithGoogle, requestUserOtp, verifyUserOtp } from '../../api/authApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';

type LoginMode = 'password' | 'otp';

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60;

const OTP_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: 'No user account was found for this email.',
  USER_DISABLED: 'This account is disabled. Please contact support.',
  NO_OTP_REQUESTED: 'Request a fresh OTP before trying to verify.',
  OTP_EXPIRED: 'That OTP has expired. Request a new code and try again.',
  INVALID_OTP: 'The OTP you entered is incorrect.',
  UNAUTHORIZED_ROLE: 'This email is not allowed in the user login flow.',
};

const getOtpErrorMessage = (error: unknown, fallback: string) => {
  const apiError = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return (apiError && OTP_ERROR_MESSAGES[apiError]) || apiError || fallback;
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login: setAuthState } = useAuth();

  const from = location.state?.from || '/';
  const [mode, setMode] = useState<LoginMode>('otp');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [otpRequestedFor, setOtpRequestedFor] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!otpExpiresAt) {
      setSecondsRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        setOtpExpiresAt(null);
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [otpExpiresAt]);

  const formatCountdown = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const completeLogin = (accessToken: string, refreshToken: string, message: string) => {
    setAuthState(accessToken, refreshToken);
    toast({ title: message });
    navigate(from, { replace: true });
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response: any = await loginUser(creds.email, creds.password);
      const { accessToken, refreshToken } = response;

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid token structure received');
      }

      completeLogin(accessToken, refreshToken, 'Welcome back!');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.response?.data?.error || 'Invalid email or password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      await requestUserOtp(creds.email);
      setOtp('');
      setOtpRequestedFor(creds.email);
      setOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      toast({
        title: 'OTP sent',
        description: 'Check your email for the 6-digit code.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to send OTP',
        description: getOtpErrorMessage(error, 'Please check the email address and try again.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      toast({
        variant: 'destructive',
        title: 'Enter complete OTP',
        description: 'Please enter the full 6-digit code.',
      });
      return;
    }

    setLoading(true);

    try {
      const response: any = await verifyUserOtp(otpRequestedFor || creds.email, otp);
      const { accessToken, refreshToken } = response;

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid token structure received');
      }

      completeLogin(accessToken, refreshToken, 'Signed in with OTP.');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'OTP verification failed',
        description: getOtpErrorMessage(error, 'The OTP could not be verified.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (res: CredentialResponse) => {
    setLoading(true);

    try {
      const response: any = await loginWithGoogle(res.credential!);
      const { accessToken, refreshToken } = response;

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid Google token structure received');
      }

      completeLogin(accessToken, refreshToken, 'Google login successful.');
    } catch {
      toast({ variant: 'destructive', title: 'Google Auth Failed' });
    } finally {
      setLoading(false);
    }
  };

  const showOtpEntry = mode === 'otp' && otpRequestedFor === creds.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/20 py-10 px-4 sm:py-20">
      <div className="w-full max-w-[420px] bg-background border p-6 md:p-12 shadow-sm animate-fade-in rounded-sm">
        <h1 className="font-serif text-3xl text-center tracking-tight">Sign In</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Use your password or get a 6-digit OTP valid for 5 minutes.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-2 rounded-sm bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => setMode('otp')}
            className={`h-11 rounded-sm text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
              mode === 'otp' ? 'bg-[#2A2623] text-white' : 'text-[#2A2623]'
            }`}
          >
            OTP Login
          </button>
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`h-11 rounded-sm text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
              mode === 'password' ? 'bg-[#2A2623] text-white' : 'text-[#2A2623]'
            }`}
          >
            Password
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Registered Email</label>
              <Input
                type="email"
                placeholder="abc@xyz.com"
                required
                value={creds.email}
                onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-bold uppercase tracking-widest text-[#2A2623] hover:opacity-60 transition-opacity"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="........"
                  required
                  value={creds.password}
                  onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#2A2623] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button className="w-full h-12 bg-[#2A2623] hover:bg-black uppercase text-xs font-bold tracking-[0.15em]" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
            </Button>
          </form>
        ) : (
          <form onSubmit={showOtpEntry ? handleVerifyOtp : handleRequestOtp} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Registered Email</label>
              <Input
                type="email"
                placeholder="abc@xyz.com"
                required
                value={creds.email}
                onChange={(e) => {
                  const email = e.target.value;
                  setCreds({ ...creds, email });
                  if (otpRequestedFor && otpRequestedFor !== email) {
                    setOtp('');
                    setOtpRequestedFor('');
                    setOtpExpiresAt(null);
                  }
                }}
                className="h-11"
              />
            </div>

            {showOtpEntry ? (
              <div className="space-y-4">
                <div className="rounded-sm border bg-secondary/20 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-[#2A2623]" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Enter the code sent to {otpRequestedFor}</p>
                      <p className="text-xs text-muted-foreground">
                        OTP expires in {secondsRemaining > 0 ? formatCountdown(secondsRemaining) : '0:00'}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">6-Digit OTP</label>
                  <InputOTP
                    maxLength={OTP_LENGTH}
                    value={otp}
                    onChange={setOtp}
                    containerClassName="justify-center"
                    pattern="^[0-9]+$"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtp('');
                      setOtpRequestedFor('');
                      setOtpExpiresAt(null);
                    }}
                    className="font-bold uppercase tracking-widest text-muted-foreground hover:text-[#2A2623] transition-colors"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRequestOtp()}
                    disabled={loading}
                    className="font-bold uppercase tracking-widest text-[#2A2623] hover:opacity-60 transition-opacity disabled:pointer-events-none disabled:opacity-40"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-dashed bg-secondary/20 p-4 text-sm text-muted-foreground">
                We&apos;ll send a 6-digit OTP to your registered email. User and admin OTP flows are separate, so this screen only works for user login.
              </div>
            )}

            <Button className="w-full h-12 bg-[#2A2623] hover:bg-black uppercase text-xs font-bold tracking-[0.15em]" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showOtpEntry ? 'Verify OTP' : 'Send OTP'}
            </Button>
          </form>
        )}

        <div className="relative my-8 text-center">
          <span className="bg-background px-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest relative z-10">Or continue with</span>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
        </div>

        <div className="w-full flex justify-center overflow-hidden">
          <div className="w-full max-w-full scale-90 sm:scale-100">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast({ variant: 'destructive', title: 'Google Auth Error' })}
              theme="outline"
              shape="rectangular"
              width="100%"
            />
          </div>
        </div>

        <p className="mt-10 text-center text-xs font-medium text-muted-foreground tracking-wide">
          New to RDC Industrial? <Link to="/signup" className="text-[#2A2623] font-bold uppercase tracking-widest hover:underline ml-1">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
