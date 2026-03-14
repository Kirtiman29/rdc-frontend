import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { loginUser, loginWithGoogle } from '../api/authApi'; 
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login: setAuthState } = useAuth(); 
  
  const from = location.state?.from || "/";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creds, setCreds] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      /**
       * ✅ FIX: Explicitly unwrap response to match Backend TokenResponse
       * structure: { accessToken, refreshToken, tokenType, expiresIn }
       */
      const response: any = await loginUser(creds.email, creds.password);
      const { accessToken, refreshToken } = response;
      
      if (accessToken && refreshToken) {
        setAuthState(accessToken, refreshToken);
        toast({ title: "Welcome back!", description: "Signed in successfully." });
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid token structure received");
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.response?.data?.error || "Invalid email or password." 
      });
    } finally { 
      setLoading(false); 
    }
  };

  const handleGoogleSuccess = async (res: CredentialResponse) => {
    setLoading(true);
    try {
      /**
       * ✅ FIX: Apply same unwrap logic for Google Authentication response
       */
      const response: any = await loginWithGoogle(res.credential!); 
      const { accessToken, refreshToken } = response;

      if (accessToken && refreshToken) {
        setAuthState(accessToken, refreshToken);
        toast({ title: "Google Login Successful" });
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid Google token structure received");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Google Auth Failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/20 py-10 px-4 sm:py-20">
      <div className="w-full max-w-[400px] bg-background border p-6 md:p-12 shadow-sm animate-fade-in rounded-sm">
        <h1 className="font-serif text-3xl text-center mb-8 tracking-tight">Sign In</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Registered Email</label>
            <Input 
              type="email" 
              placeholder="abc@xyz.com" 
              required 
              value={creds.email} 
              onChange={e => setCreds({...creds, email: e.target.value})} 
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
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                value={creds.password} 
                onChange={e => setCreds({...creds, password: e.target.value})} 
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

        <div className="relative my-8 text-center">
            <span className="bg-background px-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest relative z-10">Or continue with</span>
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
        </div>

        <div className="w-full flex justify-center overflow-hidden">
          <div className="w-full max-w-full scale-90 sm:scale-100">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast({ variant: "destructive", title: "Google Auth Error" })}
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