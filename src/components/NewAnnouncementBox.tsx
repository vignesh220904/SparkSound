import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, Bell, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import type { User } from "@supabase/supabase-js";

interface Announcement {
  id: string;
  original_text: string;
  translated_text: string | null;
  created_at: string;
  target_user_id: string | null;
}

interface NewAnnouncementBoxProps {
  user: User | null;
  onMarkAsRead: (id: string) => void;
}

export const NewAnnouncementBox: React.FC<NewAnnouncementBoxProps> = ({ user, onMarkAsRead }) => {
  const [newAnnouncement, setNewAnnouncement] = useState<Announcement | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (currentUserProfile) {
      setupNewAnnouncementListener();
    }
  }, [currentUserProfile]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const setupNewAnnouncementListener = () => {
    if (!currentUserProfile) return;

    const channel = supabase
      .channel('new-announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instructions',
          filter: `target_user_id=eq.${currentUserProfile.id}`
        },
        async (payload) => {
          const announcement = await translateAnnouncement(payload.new as Announcement);
          setNewAnnouncement(announcement);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instructions',
          filter: 'target_user_id=is.null'
        },
        async (payload) => {
          const announcement = await translateAnnouncement(payload.new as Announcement);
          setNewAnnouncement(announcement);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const translateAnnouncement = async (announcement: Announcement): Promise<Announcement> => {
    try {
      if (language !== 'en-US' && language !== 'en-IN') {
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: {
            text: announcement.original_text,
            targetLanguage: language,
            sourceLanguage: 'en-US'
          }
        });
        
        if (!error && data?.translatedText) {
          return { ...announcement, translated_text: data.translatedText };
        }
      }
      return { ...announcement, translated_text: announcement.original_text };
    } catch (error) {
      console.warn('Translation failed:', error);
      return { ...announcement, translated_text: announcement.original_text };
    }
  };

  const speakAnnouncement = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      const langMap: Record<string, string> = {
        'en-US': 'en-US',
        'hi-IN': 'hi-IN',
        'te-IN': 'te-IN',
        'ta-IN': 'ta-IN',
        'kn-IN': 'kn-IN',
        'ml-IN': 'ml-IN'
      };
      utterance.lang = langMap[language] || 'en-US';
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDismiss = () => {
    if (newAnnouncement) {
      onMarkAsRead(newAnnouncement.id);
      setNewAnnouncement(null);
    }
  };

  if (!newAnnouncement) {
    return null;
  }

  return (
    <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5 animate-slide-up shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary animate-sound-pulse" />
            <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
              New Message
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-primary/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {newAnnouncement.translated_text || newAnnouncement.original_text}
          </p>
          
          {newAnnouncement.translated_text && newAnnouncement.translated_text !== newAnnouncement.original_text && (
            <p className="text-xs text-muted-foreground italic">
              Original: {newAnnouncement.original_text}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(newAnnouncement.created_at), { addSuffix: true })}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakAnnouncement(
                  newAnnouncement.translated_text || newAnnouncement.original_text
                )}
                className="h-7 px-2 hover:bg-primary/20"
              >
                <Volume2 className="h-3 w-3 text-primary" />
              </Button>
              
              <Badge 
                variant={newAnnouncement.target_user_id ? "default" : "outline"}
                className="text-xs"
              >
                {newAnnouncement.target_user_id ? 'Personal' : 'Broadcast'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};