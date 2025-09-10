import { AlertTriangle, Volume2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EmergencyAlertProps {
  alert: {
    id: string;
    name: string;
    type: 'emergency';
    confidence: number;
    timestamp: Date;
    description: string;
  };
  isMinimized?: boolean;
  onClick?: () => void;
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ alert, isMinimized = false, onClick }) => {
  const speakAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(alert.description);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (isMinimized) {
    return (
      <Card 
        className={cn(
          "border-emergency/40 bg-gradient-to-r from-emergency/15 to-emergency/10 cursor-pointer",
          "hover:from-emergency/20 hover:to-emergency/15 transition-all duration-200",
          "animate-pulse"
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-emergency animate-bounce" />
              <div>
                <p className="text-sm font-medium text-emergency">{alert.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-xs">
              {Math.round(alert.confidence * 100)}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emergency/40 bg-gradient-to-br from-emergency/15 to-emergency/10 card-enhanced">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-emergency animate-bounce" />
              <div>
                <h4 className="font-semibold text-emergency">{alert.name}</h4>
                <p className="text-sm text-muted-foreground">Emergency Alert</p>
              </div>
            </div>
            <Badge variant="destructive" className="animate-pulse">
              {Math.round(alert.confidence * 100)}% Confidence
            </Badge>
          </div>
          
          <p className="text-sm text-foreground bg-background/50 p-3 rounded-lg">
            {alert.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={speakAlert}
              className="h-8 px-3 hover:bg-emergency/20 text-emergency"
            >
              <Volume2 className="h-4 w-4 mr-1" />
              Speak Alert
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};