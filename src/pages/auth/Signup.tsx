import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { registerUser, loginWithGoogle } from '@/api/authApi'; 
import { Loader2, MailCheck, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // ✅ Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // ✅ Production Logic: Hits Port 8081 /auth/signup
      await registerUser({
        displayName: formData.name, 
        email: formData.email,
        password: formData.password
      });

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
      const data = await loginWithGoogle(res.credential!); 
      login(data.accessToken, data.refreshToken);
      
      toast({ title: "Welcome!", description: "Account authenticated via Google." });
      navigate('/');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Google Signup Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" onContextMenu={handleContextMenu}>
      <Header />
      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground">The RDC Vault</span>
            <h1 className="font-serif text-4xl mt-3">Join the Studio</h1>
          </div>

          <div className="border border-border p-6 md:p-10 bg-background shadow-2xl rounded-sm">
            {!isRegistered ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Input 
                      placeholder="Full Name" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      required 
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1">
                    <Input 
                      type="email" 
                      placeholder="Email Address" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      required 
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Password" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        required 
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

                  <div className="space-y-1">
                    <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password" 
                        value={formData.confirmPassword} 
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                        required 
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#2A2623] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full h-12 text-xs font-bold uppercase tracking-widest mt-4 bg-[#2A2623] hover:bg-black" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Industrial Account'}
                  </Button>
                </form>

                <div className="relative my-8 text-center">
                  <span className="bg-background px-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest relative z-10">Or join with</span>
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                </div>

                <div className="w-full flex justify-center overflow-hidden">
                  <div className="w-full max-w-full scale-90 sm:scale-100">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast({ variant: "destructive", title: "Google Auth Failed" })}
                      theme="outline"
                      shape="rectangular"
                      width="100%"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 animate-fade-in">
                <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MailCheck className="h-8 w-8 text-[#2A2623]" />
                </div>
                <h2 className="font-serif text-2xl mb-4 text-[#2A2623]">Verify Your Email</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  We've sent an activation link to <span className="font-bold text-foreground">{formData.email}</span>. 
                  Please click the link in the email to verify your account and access the archive.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full h-12 text-xs font-bold uppercase tracking-widest rounded-sm">
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
