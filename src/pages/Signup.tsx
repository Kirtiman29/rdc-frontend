// src/pages/Signup.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { registerUser, loginWithGoogle } from '@/api/authApi'; 
import { saveTokens } from '@/api/apiClient';
import { Loader2, MailCheck } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); // ✅ Track success state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      /**
       * ✅ Industrial Sync: Enforces mandatory displayName 
       * Hits Port 8081 /auth/signup [cite: 104, 107]
       */
      await registerUser({
        displayName: formData.name, 
        email: formData.email,
        password: formData.password
      });

      // ✅ Show verification notice instead of navigating immediately
      setIsRegistered(true);
      toast({ title: "Registration successful" });

    } catch (error: any) {
      toast({ 
        title: "Registration Failed", 
        description: error.response?.data?.error || "An account with this email might already exist.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (res: CredentialResponse) => {
    setIsSubmitting(true);
    try {
      const response = await loginWithGoogle(res.credential!); 
      saveTokens(response.accessToken, response.refreshToken);
      toast({ title: "Welcome!", description: "Account authenticated via Google." });
      navigate('/');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Google Signup Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground">The RDC Vault</span>
            <h1 className="font-serif text-4xl mt-3">Join the Studio</h1>
          </div>

          <div className="border border-border p-8 md:p-10 bg-background shadow-2xl">
            {!isRegistered ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input 
                    placeholder="Full Name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    required 
                  />
                  <Input 
                    type="password" 
                    placeholder="Confirm Password" 
                    value={formData.confirmPassword} 
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                    required 
                  />
                  
                  <Button type="submit" className="w-full h-12 text-xs font-bold uppercase tracking-widest mt-4" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Industrial Account'}
                  </Button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-4 text-muted-foreground font-medium">Or join with</span></div>
                </div>

                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast({ variant: "destructive", title: "Google Auth Failed" })}
                    theme="outline"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
              </>
            ) : (
              // ✅ VERIFICATION MESSAGE UI
              <div className="text-center py-6 animate-fade-in">
                <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MailCheck className="h-8 w-8 text-[#2A2623]" />
                </div>
                <h2 className="font-serif text-2xl mb-4">Verify Your Email</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  We've sent an activation link to <span className="font-bold text-foreground">{formData.email}</span>. 
                  Please click the link in the email to verify your account and access the archive.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full h-12 text-xs font-bold uppercase tracking-widest">
                    Return to Sign In
                  </Button>
                </Link>
                <p className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Check your spam folder if you don't see it.
                </p>
              </div>
            )}

            {!isRegistered && (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Member already? <Link to="/login" className="text-foreground font-bold hover:underline">Sign In</Link>
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;