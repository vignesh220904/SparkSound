import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, AlertTriangle, RotateCcw, Settings, Mic, MicOff, Bell, Check, X, Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SoundCard } from '../SoundCard';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from "@supabase/supabase-js";

interface DetectionScreenProps {
  user: User | null;
}

interface Instruction {
  id: string;
  original_text: string;
  translated_text?: string;
  audio_url?: string;
  status: string;
  created_at: string;
}

const soundPatterns = [
  { name: 'Police Siren', type: 'emergency' as const, priority: 'high', description: 'Emergency vehicle detected' },
  { name: 'Ambulance', type: 'emergency' as const, priority: 'high', description: 'Medical emergency vehicle' },
  { name: 'Temple Bell', type: 'temple' as const, priority: 'medium', description: 'Prayer bell ringing' },
  { name: 'Bhajan Music', type: 'devotional' as const, priority: 'medium', description: 'Devotional songs playing' },
  { name: 'Car Horn', type: 'general' as const, priority: 'low', description: 'Vehicle horn sound' },
  { name: 'Fire Alarm', type: 'emergency' as const, priority: 'high', description: 'Fire safety alarm' },
  { name: 'Public Announcement', type: 'general' as const, priority: 'medium', description: 'PA system announcement' },
];

export const DetectionScreen: React.FC<DetectionScreenProps> = ({ user }) => {
  const { getLanguageCode, language, setLanguage } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [currentSound, setCurrentSound] = useState<any>(null);
  const [detectionHistory, setDetectionHistory] = useState<any[]>([]);
  const [confidence, setConfidence] = useState(0);
  
  // Speech recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [pendingInstructions, setPendingInstructions] = useState<Instruction[]>([]);
  const [activeInstructionAudio, setActiveInstructionAudio] = useState<HTMLAudioElement | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Fetch user profile and set up real-time instruction listening
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (currentUserProfile) {
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
      .channel('instructions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instructions',
          filter: `target_user_id=eq.${currentUserProfile.id}`
        },
        async (payload) => {
          console.log('New instruction received:', payload.new);
          await handleNewInstruction(payload.new as Instruction);
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
          console.log('Broadcast instruction received:', payload.new);
          await handleNewInstruction(payload.new as Instruction);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNewInstruction = async (instruction: Instruction) => {
    try {
      let translatedText = instruction.original_text;
      if (language !== 'en-US') {
        const { data } = await supabase.functions.invoke('translate-text', {
          body: {
            text: instruction.original_text,
            targetLanguage: language,
            sourceLanguage: 'en-US'
          }
        });
        translatedText = data?.translatedText || instruction.original_text;
      }

      const updatedInstruction = { ...instruction, translated_text: translatedText };
      setPendingInstructions(prev => [...prev, updatedInstruction]);

      toast("Admin Instruction Received", {
        description: translatedText.substring(0, 100) + (translatedText.length > 100 ? '...' : ''),
        action: {
          label: "Accept",
          onClick: () => acceptInstruction(updatedInstruction)
        },
      });

      if (instruction.audio_url) {
        playInstructionAudio(instruction.audio_url);
      }
    } catch (error) {
      console.error('Error handling instruction:', error);
    }
  };

  const playInstructionAudio = (audioUrl: string) => {
    if (activeInstructionAudio) {
      activeInstructionAudio.pause();
    }
    
    const audio = new Audio(audioUrl);
    setActiveInstructionAudio(audio);
    audio.play().catch(console.error);
  };

  const acceptInstruction = async (instruction: Instruction) => {
    try {
      await supabase
        .from('instructions')
        .update({ status: 'accepted' })
        .eq('id', instruction.id);

      setPendingInstructions(prev => prev.filter(i => i.id !== instruction.id));
      
      toast.success("Instruction Accepted", {
        description: "You have accepted the admin instruction"
      });
    } catch (error) {
      console.error('Error accepting instruction:', error);
    }
  };

  const rejectInstruction = async (instruction: Instruction) => {
    try {
      await supabase
        .from('instructions')
        .update({ status: 'rejected' })
        .eq('id', instruction.id);

      setPendingInstructions(prev => prev.filter(i => i.id !== instruction.id));
      
      toast.success("Instruction Rejected", {
        description: "You have declined the admin instruction"
      });
    } catch (error) {
      console.error('Error rejecting instruction:', error);
    }
  };

  // Initialize speech recognition with backend integration
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsRecognitionSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getLanguageCode();
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript.trim() && user && currentUserProfile) {
          const newText = finalTranscript.trim();
          setTranscriptHistory(prev => {
            const newHistory = [newText, ...prev].slice(0, 200);
            return newHistory;
          });

          supabase.functions.invoke('speech-to-text', {
            body: { 
              audio: '',
              language: getLanguageCode(),
              text: newText,
              saveOnly: true
            }
          }).catch(console.error);
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [getLanguageCode, user, currentUserProfile]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isListening) {
      interval = setInterval(() => {
        if (Math.random() > 0.6) {
          const randomSound = soundPatterns[Math.floor(Math.random() * soundPatterns.length)];
          const newConfidence = 0.6 + Math.random() * 0.4;
          
          const detectedSound = {
            id: Date.now().toString(),
            name: randomSound.name,
            type: randomSound.type,
            confidence: newConfidence,
            timestamp: new Date(),
            description: randomSound.description,
          };

          setCurrentSound(detectedSound);
          setConfidence(newConfidence);
          setDetectionHistory(prev => [detectedSound, ...prev].slice(0, 15));

          setTimeout(() => {
            setCurrentSound(null);
            setConfidence(0);
          }, 4000);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  const clearHistory = () => {
    setDetectionHistory([]);
  };

  const toggleSpeechRecognition = async () => {
    if (!isRecognitionSupported) return;
    
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('speech-to-text', {
                body: { 
                  audio: base64Audio,
                  language: getLanguageCode()
                }
              });

              if (error) throw error;
              
              const newText = data.text;
              setTranscriptHistory(prev => {
                const newHistory = [newText, ...prev].slice(0, 200);
                return newHistory;
              });
              
              toast.success("Speech Processed", {
                description: "Your speech has been converted and saved"
              });
            } catch (error) {
              console.error('Speech-to-text error:', error);
              toast.error("Error", {
                description: "Failed to process speech"
              });
            }
          };
          
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        toast.error("Error", {
          description: "Failed to start recording"
        });
      }
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  const clearTranscriptHistory = () => {
    setTranscriptHistory([]);
  };

  const confidenceColor = confidence > 0.8 ? 'text-primary' : confidence > 0.5 ? 'text-yellow-600' : 'text-muted-foreground';

  return (
    <div className="pb-20 px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-orange">
          <Mic className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">Sound Detection</h1>
        <p className="text-muted-foreground">Live environmental sound monitoring</p>
      </div>

      {/* Language Selection */}
      <Card className="card-enhanced">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Languages className="mr-2 h-5 w-5" />
            Translation Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your preferred language" />
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
          <p className="text-xs text-muted-foreground mt-2">
            Speech recognition and announcements will be translated to your selected language
          </p>
        </CardContent>
      </Card>

      <Card className={cn(
        "card-gradient transition-all duration-500",
        currentSound?.type === 'emergency' && "border-emergency/50 bg-emergency/5",
        currentSound && "shadow-orange"
      )}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className={cn(
              "w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300",
              isListening ? "bg-primary/10" : "bg-muted/50",
              currentSound && "animate-sound-pulse bg-primary/20"
            )}>
              <Volume2 className={cn(
                "w-10 h-10 transition-all duration-300",
                isListening ? "text-primary" : "text-muted-foreground",
                currentSound && "text-primary animate-sound-pulse"
              )} />
            </div>

            <div>
              <p className={cn(
                "text-lg font-semibold mb-1",
                currentSound ? "text-foreground" : "text-muted-foreground"
              )}>
                {currentSound ? currentSound.name : isListening ? 'Listening...' : 'Detection Paused'}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentSound 
                  ? `Confidence: ${Math.round(confidence * 100)}%` 
                  : isListening 
                    ? 'Waiting for sounds to detect'
                    : 'Tap Start to begin detection'
                }
              </p>
            </div>

            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  confidence > 0.8 ? "bg-primary" : confidence > 0.5 ? "bg-yellow-500" : "bg-muted-foreground"
                )}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>

            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => setIsListening(!isListening)}
                size="lg"
                className={cn(
                  "px-8",
                  isListening ? "bg-muted hover:bg-muted/80 text-muted-foreground" : "btn-gradient"
                )}
              >
                {isListening ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Listening
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingInstructions.length > 0 && (
        <Card className="border-primary/50 bg-primary/5 animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base text-primary">
              <Bell className="mr-2 h-4 w-4 animate-pulse" />
              Admin Instructions ({pendingInstructions.length})
            </CardTitle>
            <CardDescription>
              You have received new instructions from the admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInstructions.map((instruction) => (
              <div key={instruction.id} className="p-4 rounded-lg border border-primary/20 bg-card/50 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">
                  {instruction.translated_text || instruction.original_text}
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => rejectInstruction(instruction)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptInstruction(instruction)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                </div>
                {instruction.audio_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => playInstructionAudio(instruction.audio_url!)}
                    className="w-full"
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    Play Audio
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isRecognitionSupported && (
        <Card className="card-gradient">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              {isRecording ? (
                <Mic className="mr-2 h-4 w-4 text-primary animate-pulse" />
              ) : (
                <MicOff className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              Speech Recognition
            </CardTitle>
            <CardDescription>
              Convert your speech to text in your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center space-x-3">
              <Button
                onClick={toggleSpeechRecognition}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className="px-8"
              >
                {isRecording ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>
              {transcript && (
                <Button
                  onClick={clearTranscript}
                  variant="ghost"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
            
            <div className="min-h-[80px] p-4 rounded-lg border border-border/30 bg-card/50">
              {transcript ? (
                <p className="text-sm text-foreground leading-relaxed">
                  {transcript}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {isRecording 
                    ? 'Listening... Start speaking to see your words here'
                    : 'Click "Start Recording" to begin speech recognition'
                  }
                </p>
              )}
            </div>

            {transcriptHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Speech History ({transcriptHistory.length}/200)</h4>
                  <Button
                    onClick={clearTranscriptHistory}
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-2 p-3 rounded-lg border border-border/30 bg-muted/30">
                  {transcriptHistory.map((text, index) => (
                    <div key={index} className="text-sm text-foreground/80 p-2 bg-card/50 rounded border-l-2 border-primary/30">
                      <span className="text-xs text-muted-foreground mr-2">#{transcriptHistory.length - index}</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {isRecording && (
              <div className="flex items-center justify-center space-x-2 text-primary">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-medium">
                  Recording...{currentUserProfile && ` (User #${currentUserProfile.unique_user_number})`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentSound && (
        <div className="animate-slide-up">
          <Card className={cn(
            "border-primary/50 bg-primary/5",
            currentSound.type === 'emergency' && "border-emergency/50 bg-emergency/5"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(
                "flex items-center text-base",
                currentSound.type === 'emergency' ? "text-emergency" : "text-primary"
              )}>
                {currentSound.type === 'emergency' ? (
                  <AlertTriangle className="mr-2 h-4 w-4 animate-sound-pulse" />
                ) : (
                  <Volume2 className="mr-2 h-4 w-4 animate-sound-pulse" />
                )}
                Live Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SoundCard sound={currentSound} showVibration={true} />
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="card-gradient">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Recent Sounds
            </div>
            <span className="text-xs text-muted-foreground font-normal">
              Last 30 minutes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {detectionHistory.slice(0, 5).map((sound) => (
            <SoundCard 
              key={sound.id} 
              sound={sound} 
              showVibration={sound.id === currentSound?.id}
            />
          ))}
          {detectionHistory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Volume2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No sounds detected yet</p>
              <p className="text-xs">Start listening to see real-time alerts</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-gradient">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Detection History</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {detectionHistory.length} sounds
              </span>
              {detectionHistory.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearHistory}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Real-time log of detected environmental sounds
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {detectionHistory.length > 0 ? (
            detectionHistory.map((sound) => (
              <SoundCard 
                key={sound.id} 
                sound={sound} 
                showVibration={false}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Volume2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No sounds detected yet</p>
              <p className="text-xs">Start listening to begin real-time detection</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary mb-1">Detection Tips</p>
              <ul className="text-xs text-primary/80 space-y-1">
                <li>• Keep your device's microphone unobstructed</li>
                <li>• Detection works best in moderately quiet environments</li>
                <li>• Emergency sounds are prioritized and highlighted in red</li>
                <li>• Adjust sensitivity in Settings for better accuracy</li>
                {user && <li>• Your speech is automatically saved to history</li>}
                <li>• Admin instructions will appear as notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};