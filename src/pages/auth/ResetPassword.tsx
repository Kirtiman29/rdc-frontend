import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ✅ Security: Restrict Right-Click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast({ variant: "destructive", title: "Invalid Link" });
    if (newPassword !== confirmPassword) return toast({ variant: "destructive", title: "Passwords mismatch" });

    setLoading(true);
    try {
      /** * ✅ PRODUCTION SYNC:
       * Calls backend /auth/password/reset via environment-aware API client.
       */
      await resetPassword(token, newPassword);
      toast({ title: "Success", description: "Your password has been updated." });
      navigate('/login');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Link Expired", 
        description: "Reset links are valid for 10 minutes. Please request a new one." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/20 py-10 px-4 sm:py-20" onContextMenu={handleContextMenu}>
      <div className="w-full max-w-[400px] bg-background border p-6 md:p-12 shadow-sm animate-fade-in rounded-sm">
        <div className="flex justify-center mb-6 text-[#2A2623]">
          <ShieldCheck size={40} strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-3xl text-center mb-8 tracking-tight">Set New Password</h1>
        
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">New Password</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
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

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Confirm Password</label>
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className="h-11"
            />
          </div>

          <Button className="w-full h-12 bg-[#2A2623] hover:bg-black uppercase text-xs font-bold tracking-[0.15em] mt-4 rounded-sm" disabled={loading || !token}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Credentials"}
          </Button>
        </form>

        {!token && (
          <p className="mt-6 text-center text-[10px] font-bold uppercase text-destructive tracking-widest leading-relaxed">
            Invalid or missing security token
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;