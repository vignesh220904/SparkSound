import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppTranslationsProvider } from "@/contexts/AppTranslations";
import Index from "@/pages/Index";
import { LoginPage } from "./components/pages/LoginPage";
import { Dashboard } from "./components/pages/Dashboard";
import { DetectionScreen } from "./components/pages/DetectionScreen";
import { SettingsPage } from "./components/pages/SettingsPage";
import { AboutPage } from "./components/pages/AboutPage";
import { HistoryPage } from "./components/pages/HistoryPage";
import { AdminPage } from "./components/pages/AdminPage";
import { Navigation } from "./components/Navigation";
import { InstructionNotifications } from "./components/InstructionNotifications";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    setCurrentPage('home');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Index user={user} />;
      case 'detection':
        return <DetectionScreen user={user} />;
      case 'history':
        return <HistoryPage user={user} />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <Index user={user} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AppTranslationsProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen bg-gradient-background">
            {showAdmin ? (
              <AdminPage onBack={() => setShowAdmin(false)} />
            ) : !user ? (
              <LoginPage 
                onLogin={handleLogin} 
                onAdminClick={() => setShowAdmin(true)} 
              />
            ) : (
              <>
                {renderCurrentPage()}
                <Navigation 
                  currentPage={currentPage} 
                  onPageChange={setCurrentPage}
                  onAdminClick={() => setShowAdmin(true)}
                />
                <InstructionNotifications />
              </>
            )}
          </div>
          </AppTranslationsProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
