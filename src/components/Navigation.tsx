import { useState, useEffect } from 'react';
import { Home, Mic, Settings, Info, History, Shield, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppTranslations } from '@/contexts/AppTranslations';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onAdminClick: () => void;
}

export const Navigation = ({ currentPage, onPageChange, onAdminClick }: NavigationProps) => {
  const t = useAppTranslations();
  const [isAdmin, setIsAdmin] = useState(false);

  const navigationItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'detection', label: t.detection, icon: Mic },
    { id: 'history', label: t.history, icon: History },
    { id: 'settings', label: t.settings, icon: Settings },
    { id: 'about', label: t.about, icon: Info },
  ];

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: admin } = await supabase
            .from('admins')
            .select('id')
            .eq('email', user.email)
            .single();
          
          setIsAdmin(!!admin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 px-4 py-2 md:py-3 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl transition-all",
                isActive 
                  ? "bg-primary/15 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-sound-pulse")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
        
        {/* Admin Button - only show if user is admin */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdminClick}
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          >
            <Shield className="h-5 w-5" />
            <span className="text-xs font-medium">Admin</span>
          </Button>
        )}
        
        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs font-medium">Logout</span>
        </Button>
      </div>
    </nav>
  );
};