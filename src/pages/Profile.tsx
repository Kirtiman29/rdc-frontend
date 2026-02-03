// src/pages/Profile.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import { getToken } from '@/api/apiClient';
import { getProfile } from '@/api/authApi'; 
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: '', email: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = getToken();
      
      // ✅ Guard: Immediate redirect if no token is present
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetches profile from Auth Service on Port 8081
        const data = await getProfile();
        setUser({ 
          name: data.name || 'User', 
          email: data.email 
        });
        setLoading(false);
      } catch (error: any) {
        console.error("Profile sync failed:", error);
        
        // Force logout if auth failed (401/403)
        if (error.response?.status === 401 || error.response?.status === 403) {
          logout();
        } else {
          setLoading(false); 
          toast({ 
            variant: "destructive", 
            title: "Sync Error", 
            description: "Failed to synchronize profile data with the RDC archive." 
          });
        }
      }
    };
    fetchUserData();
  }, [navigate, logout, toast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({ 
      title: "Security Restriction", 
      description: "Direct profile modification is disabled. Please contact support for changes." 
    });
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
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
          
          {/* Industrial User Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-20 w-20 bg-[#2A2623] text-white rounded-none flex items-center justify-center text-3xl font-serif shadow-lg">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-[#2A2623]">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verified Industrial Partner</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-3xl">
            {/* Nav Label (Since Tabs are removed, we use a simple header) */}
            <div className="border-b border-border mb-8">
              <div className="flex items-center gap-2 border-b-2 border-[#2A2623] w-fit px-6 py-3">
                <User className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Account Profile</span>
              </div>
            </div>

            <div className="bg-background border border-border p-8 md:p-10 animate-fade-in shadow-sm">
              <h2 className="font-serif text-xs font-bold uppercase tracking-wider text-muted-foreground mb-10 pb-4 border-b border-zinc-100">
                Studio Credentials
              </h2>
              
              <form className="space-y-8" onSubmit={handleUpdate}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground block">Partner Name</label>
                    <Input
                      type="text"
                      value={user.name}
                      readOnly
                      className="bg-secondary/5 h-12 rounded-none border-zinc-200 cursor-default focus-visible:ring-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground block">Archive Email</label>
                    <Input
                      type="email"
                      disabled
                      value={user.email}
                      className="bg-secondary/10 h-12 rounded-none opacity-60 cursor-not-allowed border-zinc-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="h-12 px-8 rounded-none uppercase text-[10px] font-bold tracking-[0.2em] border-[#2A2623] text-[#2A2623] hover:bg-[#2A2623] hover:text-white transition-all"
                  >
                    Request Data Update
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="h-12 px-8 rounded-none text-destructive hover:text-white hover:bg-destructive uppercase text-[10px] font-bold tracking-[0.2em] transition-all" 
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out from Archive
                  </Button>
                </div>
              </form>

              <div className="mt-16 pt-8 border-t border-border">
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-[0.3em]">
                  RDC Industrial Archive Security Protocol: Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;