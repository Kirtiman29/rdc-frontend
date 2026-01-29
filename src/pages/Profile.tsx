// src/pages/Profile.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Package, LogOut, Loader2 } from 'lucide-react';
import { getToken } from '@/api/apiClient';
import { getProfile, updateProfile } from '@/api/authApi';
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
        setUser({ name: data.name || 'User', email: data.email });
        setLoading(false);
      } catch (error: any) {
        console.error("Profile sync failed:", error);
        
        /**
         * ✅ SMART REDIRECT
         * Only force logout if the status is 401/403 (Auth failure)
         * This allows the interceptor time to try a refresh first.
         */
        if (error.response?.status === 401 || error.response?.status === 403) {
          logout();
        } else {
          // Keep the UI visible even on generic network errors
          setLoading(false); 
        }
      }
    };
    fetchUserData();
  }, [navigate, logout]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(user);
      toast({ title: "Profile Updated", description: "Changes saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
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
          <div className="mb-12 flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-20 w-20 bg-foreground text-background rounded-full flex items-center justify-center text-3xl font-serif">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent mb-8 overflow-x-auto">
              <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground px-6 py-3 gap-2">
                <User className="h-4 w-4" /> Profile Info
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground px-6 py-3 gap-2">
                <Package className="h-4 w-4" /> Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="bg-background border border-border p-8 max-w-2xl animate-fade-in">
                <h2 className="font-serif text-xl mb-6 font-medium uppercase tracking-wider text-xs text-muted-foreground">Account Information</h2>
                <form className="space-y-6" onSubmit={handleUpdate}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Full Name</label>
                      <Input
                        type="text"
                        value={user.name}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                        className="bg-secondary/10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Email Address</label>
                      <Input
                        type="email"
                        disabled
                        value={user.email}
                        className="bg-secondary/5 opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>

                <div className="mt-12 pt-8 border-t border-border">
                  <Button variant="ghost" className="text-destructive hover:text-white hover:bg-destructive gap-2 transition-all" onClick={logout}>
                    <LogOut className="h-4 w-4" /> Sign Out from RDC
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="text-center py-20 bg-background border border-border">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No purchases found in your history.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;