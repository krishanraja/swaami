import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Join from "./pages/Join";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AdminPage from "./pages/AdminPage";
import { ChatScreen } from "./screens/ChatScreen";
import { VerificationScreen } from "./screens/VerificationScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Add default timeout to all queries
      retry: 1,
      retryDelay: 1000,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes cache time
      refetchOnWindowFocus: false,
      // Network mode to handle offline better
      networkMode: 'online',
    },
  },
});

const App = () => {
  // Ensure splash placeholder is removed and body has correct background
  useEffect(() => {
    // Remove splash placeholder
    const placeholder = document.getElementById('splash-placeholder');
    if (placeholder) {
      placeholder.classList.add('hidden');
      setTimeout(() => {
        if (placeholder.parentNode) {
          placeholder.remove();
        }
      }, 300);
    }

    // Ensure body and html have white background
    document.body.style.backgroundColor = 'hsl(var(--background))';
    document.documentElement.style.backgroundColor = 'hsl(var(--background))';
  }, []);

  // Auto-seed demo data if insufficient
  useEffect(() => {
    async function initDemoData() {
      try {
        const { getDemoDataStats, seedDemoData } = await import('./utils/seedDemoData');
        const stats = await getDemoDataStats();

        // Auto-seed if less than 50 demo tasks
        if (stats.demoTaskCount < 50) {
          await seedDemoData(200, false);
        }
      } catch {
        // Don't block app if seeding fails - it's non-critical
      }
    }

    initDemoData();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AccessibilityProvider>
            <TooltipProvider>
              <OfflineBanner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/app" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/join" element={<Join />} />
                  <Route path="/chat/:matchId" element={<ChatScreen />} />
                  <Route path="/verify" element={<VerificationScreen />} />
                  
                  {/* SEO Pages */}
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  
                  {/* Admin/Dev Tools */}
                  <Route path="/admin" element={<AdminPage />} />
                  
                  {/* Catch-all redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AccessibilityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
