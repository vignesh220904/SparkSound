import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Instruction {
  id: string;
  original_text: string;
  created_at: string;
}

export const InstructionNotifications = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);

  useEffect(() => {
    // Listen for new instructions in real-time
    const channel = supabase
      .channel('instruction-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instructions'
        },
        (payload) => {
          const newInstruction = payload.new as Instruction;
          // Only show instructions without a target_user_id (broadcast to all)
          if (!payload.new.target_user_id) {
            setInstructions(prev => [newInstruction, ...prev]);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
              setInstructions(prev => prev.filter(inst => inst.id !== newInstruction.id));
            }, 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissInstruction = (id: string) => {
    setInstructions(prev => prev.filter(inst => inst.id !== id));
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

  if (instructions.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {instructions.map((instruction) => (
        <Alert key={instruction.id} className="bg-primary/10 border-primary/20 shadow-lg">
          <div className="flex justify-between items-start">
            <AlertDescription className="flex-1 pr-2">
              <div className="font-semibold text-primary mb-1">
                Admin Message
              </div>
              <div className="text-sm">
                {instruction.original_text}
              </div>
            </AlertDescription>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakInstruction(instruction.original_text)}
                className="h-6 w-6 p-0"
              >
                <Volume2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissInstruction(instruction.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};