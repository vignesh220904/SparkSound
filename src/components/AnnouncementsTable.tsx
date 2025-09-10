import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, MessageSquare, Clock, Megaphone, RefreshCw, Languages, Globe } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import type { User } from "@supabase/supabase-js";

interface Instruction {
  id: string;
  original_text: string;
  translated_text: string | null;
  created_at: string;
  target_user_id: string | null;
}

interface AnnouncementsTableProps {
  user: User | null;
}

export const AnnouncementsTable: React.FC<AnnouncementsTableProps> = ({ user }) => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTranslated, setShowTranslated] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const { language, setLanguage } = useLanguage();

  const languageOptions = [
    { value: 'en-US', label: 'English' },
    { value: 'hi-IN', label: 'हिंदी (Hindi)' },
    { value: 'te-IN', label: 'తెలుగు (Telugu)' },
    { value: 'ta-IN', label: 'தமிழ் (Tamil)' },
    { value: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
    { value: 'ml-IN', label: 'മലയാളം (Malayalam)' }
  ];

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Update user's preferred language in database if user is authenticated
    if (user && currentUserProfile) {
      try {
        await supabase
          .from('users')
          .update({ preferred_language: newLanguage })
          .eq('user_id', user.id);
        
        // Refresh instructions to get new translations
        await fetchInstructions();
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (currentUserProfile) {
      fetchInstructions();
      setupInstructionListener();
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

  const setupInstructionListener = () => {
    if (!currentUserProfile) return;

    const channel = supabase
      .channel('announcements-table')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instructions',
          filter: `target_user_id=eq.${currentUserProfile.id}`
        },
        async (payload) => {
          const newInstruction = await translateInstruction(payload.new as Instruction);
          setInstructions(prev => [newInstruction, ...prev].slice(0, 20));
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
          const newInstruction = await translateInstruction(payload.new as Instruction);
          setInstructions(prev => [newInstruction, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const translateInstruction = async (instruction: Instruction): Promise<Instruction> => {
    try {
      if (language !== 'en-US' && language !== 'en-IN') {
        const { data, error } = await supabase.functions.invoke('translate-text', {
          body: {
            text: instruction.original_text,
            targetLanguage: language,
            sourceLanguage: 'en-US'
          }
        });
        
        if (error) {
          console.warn('Translation service unavailable:', error.message);
          return { ...instruction, translated_text: instruction.original_text };
        }
        
        return { ...instruction, translated_text: data?.translatedText || instruction.original_text };
      }
      return { ...instruction, translated_text: instruction.original_text };
    } catch (error) {
      console.warn('Translation service unavailable, showing original text:', error);
      return { ...instruction, translated_text: instruction.original_text };
    }
  };

  const handleTranslationToggle = () => {
    setShowTranslated(!showTranslated);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInstructions();
    setRefreshing(false);
  };

  const fetchInstructions = async () => {
    if (!currentUserProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('instructions')
        .select('id, original_text, translated_text, created_at, target_user_id')
        .or(`target_user_id.eq.${currentUserProfile.id},target_user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const processedInstructions = data || [];
      
      if (language !== 'en-US' && language !== 'en-IN') {
        const translationPromises = processedInstructions.map(async (instruction) => {
          try {
            return await translateInstruction(instruction);
          } catch (error) {
            console.warn('Failed to translate instruction, showing original:', error);
            return { ...instruction, translated_text: instruction.original_text };
          }
        });
        
        const translatedInstructions = await Promise.allSettled(translationPromises);
        const finalInstructions = translatedInstructions.map((result, index) => 
          result.status === 'fulfilled' 
            ? result.value 
            : { ...processedInstructions[index], translated_text: processedInstructions[index].original_text }
        );
        
        setInstructions(finalInstructions);
      } else {
        const englishInstructions = processedInstructions.map(instruction => ({
          ...instruction,
          translated_text: instruction.original_text
        }));
        setInstructions(englishInstructions);
      }
    } catch (error) {
      console.error('Error fetching instructions:', error);
    } finally {
      setLoading(false);
    }
  };

  const speakInstruction = (text: string) => {
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
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading announcements...</p>
        </CardContent>
      </Card>
    );
  }

  if (instructions.length === 0) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
        <CardTitle className="flex items-center justify-between text-primary">
          <div className="flex items-center">
            <Megaphone className="mr-2 h-5 w-5" />
            Admin Announcements
          </div>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-8 w-32 bg-background/50 border-primary/20">
              <Globe className="h-4 w-4 text-primary mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No announcements yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-primary">
          <div className="flex items-center">
            <Megaphone className="mr-2 h-5 w-5 animate-pulse" />
            Admin Announcements
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-8 w-32 bg-background/50 border-primary/20">
                <Globe className="h-4 w-4 text-primary mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTranslationToggle}
              className={`h-8 px-2 hover:bg-primary/20 ${showTranslated ? 'bg-primary/10' : ''}`}
              title={showTranslated ? 'Show original text' : 'Show translated text'}
            >
              <Languages className="h-4 w-4 text-primary mr-1" />
              <span className="text-xs">{showTranslated ? 'Translated' : 'Original'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 p-0 hover:bg-primary/20"
              title="Refresh announcements"
            >
              <RefreshCw className={`h-4 w-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant="secondary" className="text-xs">
              {instructions.length} messages
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-primary/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 border-primary/20">
                <TableHead className="text-primary font-semibold">Type</TableHead>
                <TableHead className="text-primary font-semibold">Message</TableHead>
                <TableHead className="text-primary font-semibold">Time</TableHead>
                <TableHead className="text-primary font-semibold w-16">Audio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructions.map((instruction, index) => (
                <TableRow key={instruction.id} className={`
                  ${index % 2 === 0 ? 'bg-background/50' : 'bg-background/80'}
                  hover:bg-primary/10 transition-colors border-primary/10
                `}>
                  <TableCell>
                    <Badge 
                      variant={instruction.target_user_id ? "default" : "outline"}
                      className="text-xs"
                    >
                      {instruction.target_user_id ? 'Personal' : 'Broadcast'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm font-medium truncate">
                      {showTranslated 
                        ? (instruction.translated_text || instruction.original_text)
                        : instruction.original_text
                      }
                    </p>
                    {showTranslated && instruction.translated_text && instruction.translated_text !== instruction.original_text && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Original: {instruction.original_text}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span title={format(new Date(instruction.created_at), 'PPpp')}>
                        {formatDistanceToNow(new Date(instruction.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakInstruction(
                        showTranslated 
                          ? (instruction.translated_text || instruction.original_text)
                          : instruction.original_text
                      )}
                      className="h-8 w-8 p-0 hover:bg-primary/20"
                    >
                      <Volume2 className="h-3 w-3 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};