import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Send, Users, Volume2 } from 'lucide-react';

interface User {
  id: string;
  unique_user_number: number;
  email: string;
  preferred_language: string;
}

interface AdminPageProps {
  onBack: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [instruction, setInstruction] = useState('');
  const [instructionLanguage, setInstructionLanguage] = useState('en-US');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (email === 'sparksound2025@gmail.com' && password === 'V+visioners') {
      setIsAuthenticated(true);
      toast({
        title: "Login Successful",
        description: "Welcome to SparkSounds Admin Panel",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, unique_user_number, email, preferred_language')
        .order('unique_user_number', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            const { data, error } = await supabase.functions.invoke('speech-to-text', {
              body: { 
                audio: base64Audio,
                language: 'auto'
              }
            });

            if (error) {
              console.error('Speech-to-text error:', error);
              
              // Check if it's a quota error
              if (error.message?.includes('quota') || error.message?.includes('insufficient_quota')) {
                toast({
                  title: "API Quota Exceeded",
                  description: "OpenAI API quota has been exceeded. Please check your billing details.",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Speech-to-Text Error",
                  description: error.message || "Failed to convert speech to text",
                  variant: "destructive",
                });
              }
              return;
            }
            
            setInstruction(data.text);
            
            toast({
              title: "Speech Recorded",
              description: "Your speech has been converted to text",
            });
          } catch (error) {
            console.error('Speech-to-text error:', error);
            toast({
              title: "Error",
              description: "Failed to convert speech to text",
              variant: "destructive",
            });
          }
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const sendInstruction = async () => {
    if (!instruction.trim()) {
      toast({
        title: "Error",
        description: "Please enter an instruction",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-send-instruction', {
        body: {
          instruction: instruction.trim(),
          targetUserId: selectedUser === 'all' ? null : selectedUser,
          originalLanguage: instructionLanguage
        }
      });

      if (error) throw error;

      toast({
        title: "Instruction Sent",
        description: selectedUser === 'all' 
          ? "Instruction broadcast to all users" 
          : `Instruction sent to user #${users.find(u => u.id === selectedUser)?.unique_user_number}`,
      });

      setInstruction('');
    } catch (error) {
      console.error('Error sending instruction:', error);
      toast({
        title: "Error",
        description: "Failed to send instruction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-text bg-clip-text text-transparent">
              SparkSounds Admin
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Admin access required
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50 border-primary/20"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/50 border-primary/20"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button 
              onClick={handleLogin} 
              className="w-full bg-primary hover:bg-primary/90"
            >
              Login as Admin
            </Button>
            <Button 
              variant="outline" 
              onClick={onBack}
              className="w-full border-primary/20 hover:bg-primary/10"
            >
              Back to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-text bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage user instructions</p>
          </div>
          <Button variant="outline" onClick={onBack} className="border-primary/20">
            Back to App
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{users.length}</div>
              <p className="text-sm text-muted-foreground">Total registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>Target User</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users (Broadcast)</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      User #{user.unique_user_number} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>Instruction Language</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={instructionLanguage} onValueChange={setInstructionLanguage}>
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English</SelectItem>
                  <SelectItem value="hi-IN">Hindi (हिंदी)</SelectItem>
                  <SelectItem value="te-IN">Telugu (తెలుగు)</SelectItem>
                  <SelectItem value="ta-IN">Tamil (தமிழ்)</SelectItem>
                  <SelectItem value="kn-IN">Kannada (ಕನ್ನಡ)</SelectItem>
                  <SelectItem value="ml-IN">Malayalam (മലയാളം)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>Voice Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                className="w-full"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInstruction("Emergency evacuation in progress. Please move to safety immediately.")}
                  className="w-full text-left justify-start"
                >
                  Emergency Alert
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInstruction("Please maintain silence in the temple premises.")}
                  className="w-full text-left justify-start"
                >
                  Temple Notice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Send Instruction
            </CardTitle>
            <CardDescription>
              Instructions will be automatically translated to each user's preferred language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your instruction here..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={4}
              className="bg-background/50 border-primary/20"
            />
            <Button 
              onClick={sendInstruction} 
              disabled={loading || !instruction.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Instruction
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};