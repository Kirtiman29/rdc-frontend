//src/App.tsx
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
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile"; 
import Login from "./pages/auth/Login"; 
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/payment/Checkout"; 
import PaymentSuccess from "./pages/payment/PaymentSuccess"; 
import PaymentFailure from "./pages/payment/PaymentFailure";
import Premium from "./pages/luxury/Premium";
import ExploreLuxury from "./pages/luxury/ExploreLuxury";
import InDetailedLuxury from "./pages/luxury/InDetailedLuxury";
import Trends from "./pages/trends/Trends";
import ExploreTrends from "./pages/trends/ExploreTrends";
import SpecialOffers from "./pages/special-offers/SpecialOffers";
import ExploreOffers from "./pages/special-offers/ExploreOffers";
import About from "./pages/footer/About";
import Careers from "./pages/footer/Careers";
import Contact from "./pages/footer/Contact";
import FAQ from "./pages/footer/FAQ";
import Terms from "./pages/footer/Terms";
import Privacy from "./pages/footer/Privacy";
import Signup from "./pages/auth/Signup";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Fabrics from "./pages/fabrics/Fabrics";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import CategoryPage from "./pages/CategoryPage";
import Subscription from "./pages/Subscription";
import Unsubscribe from "./pages/Unsubscribe";
import Notifications from "./pages/Notifications";

// AI Studio Imports
import Home from "./ai/pages/Home";
import DashboardLayout from "@/ai/components/layout/DashboardLayout";
import Generate from "@/ai/pages/Generate";
import BitmapStudio from "@/ai/pages/BitmapStudio";
import GeminiTextToImage from "@/ai/pages/GeminiTextToImage";
import GeminiImageToImage from "@/ai/pages/GeminiImageToImage";
import GeminiImageMix from "@/ai/pages/GeminiImageMix";
import MyDesigns from "@/ai/pages/MyDesigns";
import AiNotFound from "@/ai/pages/NotFound";
import Upscale from "@/ai/pages/Upscale";
import PatternFinder from "@/ai/pages/Patternfinder";
import Favorites from "@/ai/pages/favorites";
import TextileRecolorStudio from "@/ai/pages/TextileRecolorStudio";
import ColorSeparation from "@/ai/pages/ColorSeparation";
import AiProfile from "@/ai/pages/Profile";
import ExploreFabrics from "@/pages/fabrics/ExploreFabrics";
import IndetailFabrics from "./pages/fabrics/IndetailFabrics";


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
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/designs/:slug" element={<ProductDetail />} />
              <Route path="/product/:slug" element={<ProductDetail />} />

              {/* LUXURY ROUTES */}
              <Route path="/luxury/shop" element={<Premium />} />
              <Route path="/luxury/explore" element={<ExploreLuxury />} />
              <Route path="/luxury/design/:slug" element={<InDetailedLuxury />} />

              <Route path="/trends/shop" element={<Trends />} />
              <Route path="/trends/explore" element={<ExploreTrends />} />

              <Route path="/special-offers/shop" element={<SpecialOffers />} />
              <Route path="/special-offers/explore" element={<ExploreOffers />} />
              
              <Route path="/blogs" element={<Blog />} />
              <Route path="/blogs/:slug" element={<BlogDetail />} />
              <Route path="/categories/:slug" element={<CategoryPage />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
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
                path="/orders/:orderId" 
                element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} 
              />
              <Route 
                path="/profile" 
                element={<ProtectedRoute><Profile /></ProtectedRoute>} 
              />
              <Route
                path="/notifications"
                element={<ProtectedRoute><Notifications /></ProtectedRoute>}
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
              
                {/* AI ROUTES */}
              <Route path="/ai-studio" element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<Home />} />
                <Route path="gallery" element={<MyDesigns />} />
                <Route path="generate" element={<Generate />} />
                <Route path="bitmap" element={<BitmapStudio />} />
                <Route path="gemini-text-to-image" element={<GeminiTextToImage />} />
                <Route path="gemini-image-to-image" element={<GeminiImageToImage />} />
                <Route path="gemini-image-mix" element={<GeminiImageMix />} />
                <Route path="upscale" element={<Upscale />} />
                <Route path="finder" element={<PatternFinder />} />
                <Route path="recolor" element={<TextileRecolorStudio />} />
                <Route path="color-separation" element={<ColorSeparation />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="profile" element={<AiProfile />} />
                <Route path="*" element={<AiNotFound />} />
              </Route>

              {/* GLOBAL */}
              <Route path="*" element={<NotFound />} />

              <Route path="/fabrics/shop" element={<Fabrics />} />
              <Route path="/fabrics/explore" element={<ExploreFabrics />} />
              <Route path="/fabrics/:slug" element={<IndetailFabrics />} />
              <Route path="/fabrics/design/:slug" element={<IndetailFabrics />} />


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
