
/**
 * Cloud Document Analytics Platform
 *
 * @author Yousef M. Y. Al Sabbah
 * @course Cloud and Distributed Systems
 * @university Islamic University of Gaza
 * @date June 3, 2025
 *
 * Main application component that sets up routing and global providers
 */

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Create a client for handling API data caching and state management
const queryClient = new QueryClient();

// Enhanced Scroll to top component with loading transition
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Smooth scroll to top with a slight delay for better UX
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

// Enhanced Page transition wrapper with smooth animations
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="page-transition animate-fade-in">
      {children}
    </div>
  );
};

/**
 * Main App component
 * Sets up the application with all required providers and routing
 */
const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="cloud-docs-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
            <Route path="/dashboard" element={<PageTransition><Index /></PageTransition>} />
            <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
