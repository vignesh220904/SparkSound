import { useState } from 'react';
import { Bell, Volume2, Smartphone, Globe, Shield, Sliders } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SoundSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const SettingsPage = () => {
  const [vibrationIntensity, setVibrationIntensity] = useState([75]);
  const { language, setLanguage } = useLanguage();
  const [emergencyOverride, setEmergencyOverride] = useState(true);
  
  const [soundSettings, setSoundSettings] = useState<SoundSetting[]>([
    {
      id: 'emergency',
      name: 'Emergency Sounds',
      description: 'Police sirens, ambulances, fire trucks',
      enabled: true,
      priority: 'high'
    },
    {
      id: 'temple',
      name: 'Temple Bells',
      description: 'Prayer bells and temple sounds',
      enabled: true,
      priority: 'medium'
    },
    {
      id: 'devotional',
      name: 'Devotional Music',
      description: 'Bhajans, kirtans, and religious songs',
      enabled: true,
      priority: 'medium'
    },
    {
      id: 'traffic',
      name: 'Traffic Sounds',
      description: 'Car horns, vehicle sounds',
      enabled: false,
      priority: 'low'
    },
    {
      id: 'announcements',
      name: 'Public Announcements',
      description: 'Station announcements, public address',
      enabled: true,
      priority: 'medium'
    },
    {
      id: 'nature',
      name: 'Nature Sounds',
      description: 'Thunder, heavy rain, wind',
      enabled: false,
      priority: 'low'
    }
  ]);

  const toggleSoundSetting = (id: string) => {
    setSoundSettings(prev => 
      prev.map(setting => 
        setting.id === id 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-emergency';
      case 'medium': return 'text-primary';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="pb-20 px-4 pt-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Customize your SparkSounds experience</p>
      </div>

      {/* Sound Notifications */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Bell className="mr-2 h-5 w-5" />
            Sound Notifications
          </CardTitle>
          <CardDescription>
            Choose which sounds you want to be notified about
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {soundSettings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-card/50">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Label className="font-medium text-sm">{setting.name}</Label>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getPriorityColor(setting.priority)} bg-current/10`}>
                    {setting.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={setting.enabled}
                onCheckedChange={() => toggleSoundSetting(setting.id)}
                className="ml-4"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Vibration Settings */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Smartphone className="mr-2 h-5 w-5" />
            Vibration & Alerts
          </CardTitle>
          <CardDescription>
            Adjust haptic feedback and visual alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Vibration Intensity</Label>
              <span className="text-xs text-muted-foreground">{vibrationIntensity[0]}%</span>
            </div>
            <Slider
              value={vibrationIntensity}
              onValueChange={setVibrationIntensity}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Off</span>
              <span>Light</span>
              <span>Strong</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-card/50">
            <div>
              <Label className="font-medium text-sm">Emergency Override</Label>
              <p className="text-xs text-muted-foreground">Emergency sounds override all other notifications</p>
            </div>
            <Switch
              checked={emergencyOverride}
              onCheckedChange={setEmergencyOverride}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Accessibility */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Globe className="mr-2 h-5 w-5" />
            Language & Accessibility
          </CardTitle>
          <CardDescription>
            Set your preferred language and accessibility options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Caption Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-IN">English (India)</SelectItem>
                <SelectItem value="hi-IN">हिंदी (Hindi)</SelectItem>
                <SelectItem value="te-IN">తెలుగు (Telugu)</SelectItem>
                <SelectItem value="ta-IN">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="kn-IN">ಕನ್ನಡ (Kannada)</SelectItem>
                <SelectItem value="ml-IN">മലയാളം (Malayalam)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg border border-border/30 bg-card/50">
            <div className="flex items-start space-x-3">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Accessibility Features</p>
                <p className="text-xs text-muted-foreground mt-1">
                  SparkSounds is designed with deaf and hard-of-hearing users in mind, 
                  providing visual alerts, vibration patterns, and clear captions for all sounds.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detection Sensitivity */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sliders className="mr-2 h-5 w-5" />
            Detection Settings
          </CardTitle>
          <CardDescription>
            Fine-tune sound detection sensitivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg border border-border/30 bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Detection Sensitivity</Label>
              <span className="text-xs text-muted-foreground">High</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Higher sensitivity detects quieter sounds but may increase false positives
            </p>
            <Slider
              defaultValue={[80]}
              max={100}
              min={20}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};