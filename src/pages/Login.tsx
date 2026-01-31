import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { loginUser, loginWithGoogle } from '../api/authApi'; 
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login: setAuthState } = useAuth(); 
  
  const from = location.state?.from || "/";
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginUser(creds.email, creds.password);
      setAuthState(response.accessToken, response.refreshToken);
      toast({ title: "Welcome back!", description: "Signed in successfully." });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.response?.data?.error || "Invalid email or password." 
      });
    } finally { setLoading(false); }
  };

  const handleGoogleSuccess = async (res: CredentialResponse) => {
    setLoading(true);
    try {
      const response = await loginWithGoogle(res.credential!); 
      setAuthState(response.accessToken, response.refreshToken);
      toast({ title: "Google Login Successful" });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Google Auth Failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/20 py-20 px-4">
      <div className="w-full max-w-md bg-background border p-8 md:p-12 shadow-sm animate-fade-in">
        <h1 className="font-serif text-3xl text-center mb-8 tracking-tight">Sign In</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Registered Email</label>
            <Input 
              type="email" 
              placeholder="office@industrial-archive.com" 
              required 
              value={creds.email} 
              onChange={e => setCreds({...creds, email: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Password</label>
              {/* ✅ ADDED: Forgot Password Link */}
              <Link 
                to="/forgot-password" 
                className="text-[10px] font-bold uppercase tracking-widest text-[#2A2623] hover:opacity-60 transition-opacity"
              >
                Forgot?
              </Link>
            </div>
            <Input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={creds.password} 
              onChange={e => setCreds({...creds, password: e.target.value})} 
            />
          </div>

          <Button className="w-full h-12 bg-[#2A2623] hover:bg-black uppercase text-xs font-bold tracking-[0.15em]" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
          </Button>
        </form>

        <div className="relative my-8 text-center">
            <span className="bg-background px-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest relative z-10">Or continue with</span>
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
        </div>

        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast({ variant: "destructive", title: "Google Auth Error" })}
            theme="outline"
            shape="rectangular"
            width="360px"
          />
        </div>

        <p className="mt-10 text-center text-xs font-medium text-muted-foreground tracking-wide">
          New to RDC Industrial? <Link to="/signup" className="text-[#2A2623] font-bold uppercase tracking-widest hover:underline ml-1">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;