import { useState, useEffect } from 'react';
import { Bell, Volume2, AlertTriangle, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoundCardProps {
  sound: {
    id: string;
    name: string;
    type: 'emergency' | 'devotional' | 'general' | 'temple';
    confidence: number;
    timestamp: Date;
    description: string;
  };
  showVibration?: boolean;
}

const soundIcons = {
  emergency: AlertTriangle,
  devotional: Music,
  general: Volume2,
  temple: Bell,
};

const soundColors = {
  emergency: 'text-emergency bg-emergency/10 border-emergency/20',
  devotional: 'text-sound-devotional bg-sound-devotional/10 border-sound-devotional/20',
  general: 'text-sound-general bg-sound-general/10 border-sound-general/20',
  temple: 'text-sound-temple bg-sound-temple/10 border-sound-temple/20',
};

export const SoundCard = ({ sound, showVibration = false }: SoundCardProps) => {
  const [isAnimating, setIsAnimating] = useState(showVibration);
  const Icon = soundIcons[sound.type];
  
  useEffect(() => {
    if (showVibration) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showVibration]);

  const isEmergency = sound.type === 'emergency';

  return (
    <div
      className={cn(
        "sound-card p-4 transition-all duration-300",
        isEmergency && "emergency-card border-emergency/30",
        isAnimating && "animate-vibrate",
        soundColors[sound.type]
      )}
    >
      <div className="flex items-start space-x-3">
        <div
          className={cn(
            "p-3 rounded-full flex-shrink-0",
            isEmergency ? "bg-white/20" : "bg-current/10",
            isAnimating && "animate-sound-pulse"
          )}
        >
          <Icon 
            size={24} 
            className={cn(
              isEmergency ? "text-white" : "text-current"
            )}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              "font-semibold text-sm",
              isEmergency ? "text-white" : "text-foreground"
            )}>
              {sound.name}
            </h3>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              isEmergency 
                ? "bg-white/20 text-white" 
                : "bg-primary/10 text-primary"
            )}>
              {Math.round(sound.confidence * 100)}%
            </span>
          </div>
          
          <p className={cn(
            "text-xs mb-2",
            isEmergency ? "text-white/80" : "text-muted-foreground"
          )}>
            {sound.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs",
              isEmergency ? "text-white/60" : "text-muted-foreground"
            )}>
              {sound.timestamp.toLocaleTimeString()}
            </span>
            
            {isAnimating && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-ping" />
                <span className="text-xs font-medium">
                  Live
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};