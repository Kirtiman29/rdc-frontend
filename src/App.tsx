import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import Checkout from "./pages/Checkout"; 
import PaymentSuccess from "./pages/PaymentSuccess"; 
import PaymentFailure from "./pages/PaymentFailure";
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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

/**
 * ✅ PRODUCTION BEST PRACTICE:
 * Pulling the Client ID from environment variables to allow 
 * seamless switching between development and production registries.
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  const location = useLocation();
  
  if (!token) {
    /**
     * ✅ SESSION SECURITY:
     * Redirects to login while preserving the intended 'from' destination.
     * replace: true prevents the login page from cluttering the back history.
     */
    return <Navigate to="/login" state={{ from: location }} replace />;
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
              
              {/* ✅ RECOVERY & VERIFICATION:
                  Registry credentials management routes.
              */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verification-success" element={<Login />} />

              {/* Protected Routes (Require Token) */}
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
              <Route 
                path="/checkout" 
                element={<ProtectedRoute><Checkout /></ProtectedRoute>} 
              />

              <Route 
                path="/payment-success" 
                element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} 
              />
              <Route 
                path="/payment-failure" 
                element={<ProtectedRoute><PaymentFailure /></ProtectedRoute>} 
              />  

              {/* Info & Legal Routes */}
              <Route path="/about" element={<About />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;