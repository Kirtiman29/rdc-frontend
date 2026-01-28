import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getToken } from "@/api/apiClient";
import { AuthProvider } from "@/hooks/useAuth";

// Page Imports
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile"; 
import Login from "./pages/Login"; 
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Premium from "./pages/Premium";
import Trends from "./pages/Trends";
import SpecialOffers from "./pages/SpecialOffers";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ✅ Your Backend Client ID 
const GOOGLE_CLIENT_ID = "121636299170-gmk6tc3ubdq543bjolttsa27gucgcf7o.apps.googleusercontent.com";

/**
 * ✅ FIXED Industrial Guard: ProtectedRoute
 * We check getToken() directly instead of a state variable.
 * This prevents the "flash logout" redirect during navigation.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  
  // If no token exists in localStorage, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/special-offers" element={<SpecialOffers />} />
              
              {/* Auth Routes */}
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />

              {/* ✅ Protected Routes - Direct Token Validation */}
              <Route 
                path="/orders" 
                element={<ProtectedRoute><Orders /></ProtectedRoute>} 
              />
              <Route 
                path="/profile" 
                element={<ProtectedRoute><Profile /></ProtectedRoute>} 
              />
              <Route 
                path="/wishlist" 
                element={<ProtectedRoute><Wishlist /></ProtectedRoute>} 
              />
              <Route 
                path="/cart" 
                element={<ProtectedRoute><Cart /></ProtectedRoute>} 
              />

              {/* Info Routes */}
              <Route path="/about" element={<About />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;