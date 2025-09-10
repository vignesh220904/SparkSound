import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Volume2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SoundCard } from '../SoundCard';
import { NewAnnouncementBox } from '../NewAnnouncementBox';
import { PastAnnouncementsBox } from '../PastAnnouncementsBox';
import { EmergencyAlert } from '../EmergencyAlert';
import { AnnouncementsTable } from '../AnnouncementsTable';
import { cn } from '@/lib/utils';
import type { User } from "@supabase/supabase-js";

// Mock data for demonstration
const mockSounds = [
  {
    id: '1',
    name: 'Police Siren',
    type: 'emergency' as const,
    confidence: 0.95,
    timestamp: new Date(),
    description: 'Emergency vehicle approaching from the south'
  },
  {
    id: '2', 
    name: 'Temple Bell',
    type: 'temple' as const,
    confidence: 0.88,
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    description: 'Evening prayer bell from nearby temple'
  },
  {
    id: '3',
    name: 'Bhajan Music',
    type: 'devotional' as const,
    confidence: 0.75,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    description: 'Devotional songs from community gathering'
  },
  {
    id: '4',
    name: 'Car Horn',
    type: 'general' as const,
    confidence: 0.82,
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    description: 'Vehicle horn from nearby street'
  }
];

export const Dashboard = ({ user }: { user: User | null }) => {
  const [sounds, setSounds] = useState(mockSounds);
  const [isListening, setIsListening] = useState(true);
  const [currentSound, setCurrentSound] = useState<typeof mockSounds[0] | null>(null);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());
  const [showEmergencyDetails, setShowEmergencyDetails] = useState(false);

  useEffect(() => {
    // Simulate real-time sound detection
    if (isListening) {
      const interval = setInterval(() => {
        const soundTypes = ['emergency', 'devotional', 'general', 'temple'] as const;
        const randomType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
        
        const newSound = {
          id: Date.now().toString(),
          name: 'New Sound Detected',
          type: randomType,
          confidence: 0.7 + Math.random() * 0.3,
          timestamp: new Date(),
          description: 'Live sound detection in progress'
        };
        
        setCurrentSound(newSound);
        setSounds(prev => [newSound, ...prev].slice(0, 10));
        
        setTimeout(() => setCurrentSound(null), 3000);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [isListening]);

  const emergencySounds = sounds.filter(s => s.type === 'emergency');
  const recentSounds = sounds.slice(0, 5);
  
  const handleMarkAnnouncementAsRead = (id: string) => {
    setReadAnnouncements(prev => new Set([...prev, id]));
  };

  return (
    <div className="pb-20 px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">SparkSounds</h1>
        <p className="text-muted-foreground">Real-time sound awareness for everyone</p>
      </div>

      {/* New Announcement Box */}
      <NewAnnouncementBox user={user} onMarkAsRead={handleMarkAnnouncementAsRead} />

      {/* Past Announcements Box */}
      <PastAnnouncementsBox user={user} />

      {/* Status Card */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "p-4 rounded-full transition-all duration-300",
                isListening ? "bg-primary/15 ring-2 ring-primary/20" : "bg-muted"
              )}>
                <Activity className={cn(
                  "w-6 h-6",
                  isListening ? "text-primary animate-sound-pulse" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-semibold text-base">
                  {isListening ? 'Actively Listening' : 'Detection Paused'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isListening ? 'Real-time environmental monitoring' : 'Tap to resume monitoring'}
                </p>
              </div>
            </div>
            <Button
              variant={isListening ? "secondary" : "default"}
              size="lg"
              onClick={() => setIsListening(!isListening)}
              className={isListening ? "hover:bg-secondary/80" : "btn-gradient text-lg px-6 py-3"}
            >
              {isListening ? 'Pause' : 'Start'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Detection */}
      {currentSound && (
        <div className="animate-slide-up">
          <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm card-enhanced">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-primary text-lg">
                <Volume2 className="mr-3 h-5 w-5 animate-sound-pulse" />
                🔴 Live Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SoundCard sound={currentSound} showVibration={true} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emergency Alerts - Minimized */}
      {emergencySounds.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-emergency flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 animate-bounce" />
              Emergency Alerts ({emergencySounds.length})
            </h3>
            {emergencySounds.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmergencyDetails(!showEmergencyDetails)}
                className="text-emergency hover:bg-emergency/10"
              >
                {showEmergencyDetails ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
          
          <EmergencyAlert
            alert={emergencySounds[0]}
            isMinimized={!showEmergencyDetails}
            onClick={() => setShowEmergencyDetails(true)}
          />
          
          {showEmergencyDetails && emergencySounds.slice(1, 3).map((sound) => (
            <EmergencyAlert key={sound.id} alert={sound} isMinimized={false} />
          ))}
        </div>
      )}
      
      {/* Recent Sounds */}
      <Card className="card-enhanced">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Detections
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {recentSounds.length > 0 ? (
            recentSounds.map((sound) => (
              <SoundCard key={sound.id} sound={sound} />
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No recent detections</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};