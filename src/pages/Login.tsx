// src/pages/Login.tsx

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { loginUser, loginWithGoogle } from '../api/authApi'; // ✅ FIXED: Corrected names
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
      // ✅ Sync: Calls authApi.loginUser (Port 8081)
      const response = await loginUser(creds.email, creds.password);
      
      // Update global context state
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

  /**
   * ✅ GOOGLE OAUTH SUCCESS: Triggers the backend /auth/google logic
   * Sends the ID Token to backend for verification [cite: 15-17]
   */
  const handleGoogleSuccess = async (res: CredentialResponse) => {
    setLoading(true);
    try {
      // res.credential is the ID Token provided by Google
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
        <h1 className="font-serif text-3xl text-center mb-8">Sign In</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
            <Input 
              type="email" 
              placeholder="you@email.com" 
              required 
              value={creds.email} 
              onChange={e => setCreds({...creds, email: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={creds.password} 
              onChange={e => setCreds({...creds, password: e.target.value})} 
            />
          </div>
          <Button className="w-full h-11 uppercase text-xs font-bold tracking-widest" disabled={loading}>
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
            width="100%"
          />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to RDC? <Link to="/signup" className="text-foreground font-bold hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;