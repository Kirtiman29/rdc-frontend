import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Package, Heart, LogOut } from 'lucide-react';

const Profile = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mock user data
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-secondary/20 flex items-center justify-center py-20">
          <div className="w-full max-w-md mx-4">
            <div className="bg-background border border-border p-8 md:p-12">
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-medium">Welcome Back</h1>
                <p className="text-muted-foreground mt-2">
                  Sign in to access your account
                </p>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="mt-2"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setIsLoggedIn(true)}
                >
                  Sign In
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-foreground underline hover:no-underline">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* Page Header */}
          <div className="mb-12">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Your Account
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Profile
            </h1>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent mb-8">
              <TabsTrigger 
                value="profile" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3 gap-2"
              >
                <User className="h-4 w-4" />
                Profile Info
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3 gap-2"
              >
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger 
                value="wishlist" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3 gap-2"
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-background border border-border p-8 max-w-2xl">
                <h2 className="font-serif text-xl mb-6">Account Information</h2>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Full Name
                      </label>
                      <Input
                        type="text"
                        defaultValue={user.name}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Email
                      </label>
                      <Input
                        type="email"
                        defaultValue={user.email}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </form>

                <div className="mt-10 pt-8 border-t border-border">
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive gap-2"
                    onClick={() => setIsLoggedIn(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Your orders will appear here</p>
                <Button asChild variant="outline">
                  <Link to="/orders">View All Orders</Link>
                </Button>
              </div>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
                <Button asChild variant="outline">
                  <Link to="/gallery">Browse Designs</Link>
                </Button>
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
