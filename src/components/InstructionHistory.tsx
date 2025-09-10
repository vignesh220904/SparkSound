import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Instruction {
  id: string;
  original_text: string;
  translated_text: string | null;
  created_at: string;
  target_user_id: string | null;
}

export const InstructionHistory = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing instructions
    fetchInstructions();

    // Listen for new instructions in real-time
    const channel = supabase
      .channel('instruction-history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instructions'
        },
        (payload) => {
          const newInstruction = payload.new as Instruction;
          // Add new instruction to the top of the list
          setInstructions(prev => [newInstruction, ...prev].slice(0, 500));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('instructions')
        .select('id, original_text, translated_text, created_at, target_user_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInstructions(data || []);
    } catch (error) {
      console.error('Error fetching instructions:', error);
    } finally {
      setLoading(false);
    }
  };

  const speakInstruction = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <Card className="card-gradient">
        <CardContent className="p-6 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading instructions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gradient">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            Admin Instructions
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            {instructions.length} messages
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 max-h-96 overflow-y-auto">
        {instructions.length > 0 ? (
          instructions.map((instruction) => (
            <div
              key={instruction.id}
              className="p-3 bg-background/50 rounded-lg border border-border/30 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">
                      {instruction.target_user_id ? 'Personal Message' : 'Broadcast'}
                    </span>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(instruction.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-sm text-foreground">
                    {instruction.translated_text || instruction.original_text}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakInstruction(instruction.translated_text || instruction.original_text)}
                  className="h-8 w-8 p-0 ml-2 shrink-0"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No instructions yet</p>
            <p className="text-xs">Admin messages will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};