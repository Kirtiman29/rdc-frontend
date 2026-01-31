import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast({ variant: "destructive", title: "Invalid Link" });
    if (newPassword !== confirmPassword) return toast({ variant: "destructive", title: "Passwords mismatch" });

    setLoading(true);
    try {
      // Sync: Calls backend /auth/password/reset 
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
    <div className="min-h-screen flex items-center justify-center bg-secondary/20 py-20 px-4">
      <div className="w-full max-w-md bg-background border p-8 md:p-12 shadow-sm animate-fade-in">
        <div className="flex justify-center mb-6 text-[#2A2623]">
          <ShieldCheck size={40} strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-3xl text-center mb-8 tracking-tight">Set New Password</h1>
        
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">New Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Confirm Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
            />
          </div>
          <Button className="w-full h-12 bg-[#2A2623] hover:bg-black uppercase text-xs font-bold tracking-[0.15em] mt-4" disabled={loading || !token}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Credentials
          </Button>
        </form>

        {!token && (
          <p className="mt-6 text-center text-xs font-bold uppercase text-destructive tracking-widest">
            Invalid or missing security token
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;