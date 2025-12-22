import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AppRoute, AuthRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";
import { AuthDebugPanel } from "@/components/dev/AuthDebugPanel";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Join from "./pages/Join";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import { ChatScreen } from "./screens/ChatScreen";
import { VerificationScreen } from "./screens/VerificationScreen";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AccessibilityProvider>
          <TooltipProvider>
            <OfflineBanner />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/* Dev-only auth debug panel */}
              <AuthDebugPanel />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                
                {/* Auth routes - redirect if already authenticated */}
                <Route path="/auth" element={
                  <PublicOnlyRoute>
                    <Auth />
                  </PublicOnlyRoute>
                } />
                
                {/* Onboarding - requires auth but not onboarding */}
                <Route path="/join" element={
                  <AuthRoute>
                    <Join />
                  </AuthRoute>
                } />
                
                {/* Protected app routes - require auth + onboarding */}
                <Route path="/app" element={
                  <AppRoute>
                    <Index />
                  </AppRoute>
                } />
                <Route path="/chat/:matchId" element={
                  <AppRoute>
                    <ChatScreen />
                  </AppRoute>
                } />
                <Route path="/verify" element={
                  <AuthRoute>
                    <VerificationScreen />
                  </AuthRoute>
                } />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
