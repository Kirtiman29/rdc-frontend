import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@/api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // ✅ Security: Restrict Right-Click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      /** * ✅ PRODUCTION SYNC:
       * Calls Auth Service /auth/password/request-reset.
       * The centralized apiClient handles the production base URL via env.
       */
      await requestPasswordReset(email);
      setSubmitted(true);
      toast({ title: "Email Sent", description: "If an account exists, a reset link has been sent." });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Could not process request. Please try again later." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/20 py-10 px-4 sm:py-20" onContextMenu={handleContextMenu}>
      <div className="w-full max-w-[400px] bg-background border p-6 md:p-12 shadow-sm animate-fade-in rounded-sm">
        {/* Page Header Restored */}
        <h1 className="font-serif text-3xl text-center mb-4 tracking-tight">Account Recovery</h1>
        <p className="text-center text-sm text-muted-foreground mb-8 leading-relaxed">
          {submitted 
            ? "Check your inbox for instructions to reset your password." 
            : "Enter your industrial account email to receive a secure reset link."}
        </p>
        
        {!submitted ? (
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Registered Email</label>
              <Input 
                type="email" 
                placeholder="abc@xyz.com" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="h-11"
              />
            </div>
            <Button className="w-full h-12 bg-[#2A2623] hover:bg-black uppercase text-xs font-bold tracking-[0.15em]" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground italic mb-6 tracking-widest">
              Check your Spam folder and mark as 'Not Spam' if required. 
            </p>
          </div>
        )}

        {/* Navigation Restored */}
        <div className="mt-8 pt-6 border-t border-border flex justify-center">
          <Link to="/login" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-[#2A2623] transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;