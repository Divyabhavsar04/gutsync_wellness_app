import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  // If Supabase is not configured, allow access without auth
  const isSupabaseConfigured = !!supabase;

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-display text-3xl font-bold gradient-text">GUTSYNC</h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // If Supabase is configured, require authentication
  if (isSupabaseConfigured && !user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const isSupabaseConfigured = !!supabase;

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-display text-3xl font-bold gradient-text">GUTSYNC</h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // If Supabase is configured and user is logged in, redirect to home
  if (isSupabaseConfigured && user) {
    return <Navigate to="/" replace />;
  }
  
  // If Supabase is not configured, show auth page but it will show an error
  // If Supabase is configured and no user, show auth page
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth"
            element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
