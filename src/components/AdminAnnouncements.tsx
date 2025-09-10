import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Volume2, MessageSquare, Clock, Speaker, Languages, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { User } from "@supabase/supabase-js";

interface Instruction {
  id: string;
  original_text: string;
  translated_text: string | null;
  created_at: string;
  target_user_id: string | null;
}

interface AdminAnnouncementsProps {
  user: User | null;
}

export const AdminAnnouncements: React.FC<AdminAnnouncementsProps> = ({ user }) => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [showTranslated, setShowTranslated] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { language, setLanguage } = useLanguage();

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
      .channel('admin-announcements')
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
          setInstructions(prev => [newInstruction, ...prev].slice(0, 10));
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
          setInstructions(prev => [newInstruction, ...prev].slice(0, 10));
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
          console.warn('Translation service error:', error.message);
          toast.error(`Translation failed: ${error.message}`);
          return { ...instruction, translated_text: `[Translation unavailable] ${instruction.original_text}` };
        }
        
        return { ...instruction, translated_text: data?.translatedText || instruction.original_text };
      }
      return { ...instruction, translated_text: instruction.original_text };
    } catch (error) {
      console.warn('Translation service unavailable:', error);
      toast.error('Translation service temporarily unavailable');
      return { ...instruction, translated_text: `[Translation unavailable] ${instruction.original_text}` };
    }
  };

  const fetchInstructions = async () => {
    if (!currentUserProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('instructions')
        .select('id, original_text, translated_text, created_at, target_user_id')
        .or(`target_user_id.eq.${currentUserProfile.id},target_user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Always show instructions, with or without translation
      const processedInstructions = data || [];
      
      // Try to translate if needed, but don't block on failures
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
        // For English variants, just use original text
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
      
      // Set language for speech synthesis
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

  const handleLanguageChange = async (newLanguage: string) => {
    if (!currentUserProfile) return;
    
    try {
      // Update language context first
      setLanguage(newLanguage);
      
      // Update user's preferred language in database
      const { error } = await supabase
        .from('users')
        .update({ preferred_language: newLanguage })
        .eq('id', currentUserProfile.id);
      
      if (error) throw error;
      
      // Update current user profile to reflect new language
      setCurrentUserProfile(prev => ({ ...prev, preferred_language: newLanguage }));
      
      // Force re-fetch and re-translate all instructions with new language
      setLoading(true);
      await fetchInstructionsForLanguage(newLanguage);
      setLoading(false);
      
      toast.success('Language updated successfully');
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error('Failed to update language');
    }
  };

  const fetchInstructionsForLanguage = async (targetLanguage: string) => {
    if (!currentUserProfile) return;
    
    try {
      // Fetch fresh instructions without using cached translated_text
      const { data, error } = await supabase
        .from('instructions')
        .select('id, original_text, created_at, target_user_id')
        .or(`target_user_id.eq.${currentUserProfile.id},target_user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const processedInstructions = data || [];
      
      // Translate all instructions to the new language
      if (targetLanguage !== 'en-US' && targetLanguage !== 'en-IN') {
        toast.info('Translating announcements to your preferred language...');
        
        const translationPromises = processedInstructions.map(async (instruction) => {
          try {
            const { data: translationData, error: translationError } = await supabase.functions.invoke('translate-text', {
              body: {
                text: instruction.original_text,
                targetLanguage: targetLanguage,
                sourceLanguage: 'en-US'
              }
            });
            
            if (translationError) {
              console.warn('Translation failed for instruction:', instruction.id, translationError.message);
              return { ...instruction, translated_text: `[Translation unavailable] ${instruction.original_text}` };
            }
            
            return { ...instruction, translated_text: translationData?.translatedText || instruction.original_text };
          } catch (error) {
            console.warn('Failed to translate instruction:', error);
            return { ...instruction, translated_text: `[Translation unavailable] ${instruction.original_text}` };
          }
        });
        
        const translatedInstructions = await Promise.allSettled(translationPromises);
        const finalInstructions = translatedInstructions.map((result, index) => 
          result.status === 'fulfilled' 
            ? result.value 
            : { ...processedInstructions[index], translated_text: `[Translation unavailable] ${processedInstructions[index].original_text}` }
        );
        
        setInstructions(finalInstructions);
        
        // Check if any translations failed
        const failedTranslations = finalInstructions.filter(inst => 
          inst.translated_text?.startsWith('[Translation unavailable]')
        );
        
        if (failedTranslations.length > 0) {
          toast.warning(`Translation service unavailable. Showing ${failedTranslations.length} original messages.`);
        } else {
          toast.success('Announcements translated successfully!');
        }
      } else {
        // For English variants, just use original text
        const englishInstructions = processedInstructions.map(instruction => ({
          ...instruction,
          translated_text: instruction.original_text
        }));
        setInstructions(englishInstructions);
        toast.success('Language updated to English');
      }
    } catch (error) {
      console.error('Error fetching instructions for language:', error);
      toast.error('Failed to update language preference');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInstructions();
    setRefreshing(false);
    toast.success('Announcements refreshed');
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
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base text-primary">
          <div className="flex items-center">
            <Speaker className="mr-2 h-4 w-4 animate-pulse" />
            Admin Announcements
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue>
                  <div className="flex items-center gap-1">
                    <Languages className="w-3 h-3" />
                    {language === 'en-IN' ? 'English' :
                     language === 'hi-IN' ? 'हिंदी' :
                     language === 'te-IN' ? 'తెలుగు' :
                     language === 'ta-IN' ? 'தமிழ்' :
                     language === 'kn-IN' ? 'ಕನ್ನಡ' :
                     language === 'ml-IN' ? 'മലയാളം' : 'English'}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-IN">English</SelectItem>
                <SelectItem value="hi-IN">हिंदी (Hindi)</SelectItem>
                <SelectItem value="te-IN">తెలుగు (Telugu)</SelectItem>
                <SelectItem value="ta-IN">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="kn-IN">ಕನ್ನಡ (Kannada)</SelectItem>
                <SelectItem value="ml-IN">മലയാളം (Malayalam)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <span className="text-xs text-primary/70 font-normal">
              {instructions.length} messages
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Translation</TableHead>
                <TableHead className="w-[150px]">Time</TableHead>
                <TableHead className="w-[80px]">Audio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructions.map((instruction) => (
                <TableRow key={instruction.id}>
                  <TableCell className="font-medium">
                    {instruction.target_user_id ? 'Personal' : 'Broadcast'}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{instruction.original_text}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {instruction.translated_text && instruction.translated_text !== instruction.original_text 
                        ? instruction.translated_text 
                        : '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(instruction.created_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakInstruction(
                        instruction.translated_text || instruction.original_text
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