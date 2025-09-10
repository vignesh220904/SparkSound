import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, MessageSquare, Clock, History } from 'lucide-react';
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

interface PastAnnouncementsBoxProps {
  user: User | null;
}

export const PastAnnouncementsBox: React.FC<PastAnnouncementsBoxProps> = ({ user }) => {
  const [pastAnnouncements, setPastAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    fetchPastAnnouncements();
    if (currentUserProfile) {
      setupRealtimeListener();
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

  const fetchPastAnnouncements = async () => {
    try {
      let query = supabase
        .from('instructions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (currentUserProfile) {
        query = query.or(`target_user_id.eq.${currentUserProfile.id},target_user_id.is.null`);
      } else {
        query = query.is('target_user_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const translatedAnnouncements = await Promise.all(
        (data || []).map(async (announcement) => {
          return await translateAnnouncement(announcement);
        })
      );

      setPastAnnouncements(translatedAnnouncements);
    } catch (error) {
      console.error('Error fetching past announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    if (!currentUserProfile) return;

    const channel = supabase
      .channel('past-announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instructions',
        },
        async (payload) => {
          // Add to past announcements with a small delay to avoid showing as "new"
          setTimeout(async () => {
            const announcement = await translateAnnouncement(payload.new as Announcement);
            setPastAnnouncements(prev => [announcement, ...prev.slice(0, 9)]);
          }, 5000); // 5 second delay
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

  if (loading) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading past messages...</p>
        </CardContent>
      </Card>
    );
  }

  if (pastAnnouncements.length === 0) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium">
            <History className="h-4 w-4 mr-2 text-muted-foreground" />
            Past Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4 text-muted-foreground">
            <MessageSquare className="mx-auto h-6 w-6 mb-2 opacity-50" />
            <p className="text-xs">No past messages</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30 border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center">
            <History className="h-4 w-4 mr-2 text-muted-foreground" />
            Past Messages
          </div>
          <Badge variant="outline" className="text-xs">
            Last {pastAnnouncements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2 max-h-64 overflow-y-auto">
        {pastAnnouncements.map((announcement) => (
          <div
            key={announcement.id}
            className="p-3 bg-background/50 rounded-lg border border-border/20 space-y-2"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge 
                    variant={announcement.target_user_id ? "default" : "outline"}
                    className="text-xs shrink-0"
                  >
                    {announcement.target_user_id ? 'Personal' : 'Broadcast'}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    <span className="truncate">
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-foreground line-clamp-2">
                  {announcement.translated_text || announcement.original_text}
                </p>
                
                {announcement.translated_text && announcement.translated_text !== announcement.original_text && (
                  <p className="text-xs text-muted-foreground italic line-clamp-1 mt-1">
                    Original: {announcement.original_text}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakAnnouncement(
                  announcement.translated_text || announcement.original_text
                )}
                className="h-7 w-7 p-0 shrink-0 hover:bg-muted"
              >
                <Volume2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};