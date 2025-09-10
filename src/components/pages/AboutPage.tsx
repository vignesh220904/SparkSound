import { Heart, Shield, Users, Zap, HelpCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AboutPage = () => {
  const features = [
    {
      icon: Shield,
      title: 'Accessibility First',
      description: 'Designed specifically for deaf and hard-of-hearing users with visual alerts and vibration patterns.'
    },
    {
      icon: Zap,
      title: 'Real-time Detection',
      description: 'Advanced AI recognizes environmental sounds instantly, providing immediate awareness.'
    },
    {
      icon: Users,
      title: 'Cultural Awareness',
      description: 'Recognizes culturally important sounds like temple bells, bhajans, and community events.'
    },
    {
      icon: Heart,
      title: 'Emergency Priority',
      description: 'Emergency sounds automatically override other notifications for your safety.'
    }
  ];

  const faqs = [
    {
      question: 'How does SparkSounds work?',
      answer: 'SparkSounds uses advanced machine learning to analyze audio in real-time, identifying different types of sounds and providing visual alerts with vibration feedback.'
    },
    {
      question: 'What types of sounds can it detect?',
      answer: 'SparkSounds recognizes emergency sounds (sirens, alarms), cultural sounds (temple bells, devotional music), traffic sounds, and public announcements.'
    },
    {
      question: 'Is my privacy protected?',
      answer: 'Yes! All sound processing happens locally on your device. SparkSounds does not record or store any audio data.'
    },
    {
      question: 'Can I customize the alerts?',
      answer: 'Absolutely! You can choose which sounds to be notified about, adjust vibration intensity, and set your preferred language for captions.'
    }
  ];

  return (
    <div className="pb-20 px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-green">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">About SparkSounds</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Empowering deaf and hard-of-hearing individuals with real-time environmental sound awareness
        </p>
      </div>

      {/* Mission Statement */}
      <Card className="card-gradient">
        <CardContent className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Our Mission</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SparkSounds bridges the gap between the hearing and deaf communities by providing 
            instant, visual awareness of environmental sounds. We believe everyone deserves 
            to feel safe, connected, and aware of their surroundings.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-lg">Key Features</CardTitle>
          <CardDescription>
            What makes SparkSounds special
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-card/50 border border-border/30">
                <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="text-lg">How to Use SparkSounds</CardTitle>
          <CardDescription>
            Getting started is simple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Enable Notifications</p>
              <p className="text-xs text-muted-foreground">Allow SparkSounds to send you visual alerts and vibrations</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-sm font-medium">Customize Settings</p>
              <p className="text-xs text-muted-foreground">Choose which sounds to detect and adjust alert preferences</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="text-sm font-medium">Stay Aware</p>
              <p className="text-xs text-muted-foreground">Receive real-time alerts about important sounds around you</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <HelpCircle className="mr-2 h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="p-3 rounded-lg bg-card/50 border border-border/30">
              <h3 className="font-medium text-sm mb-2 text-foreground">{faq.question}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact & Support */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Mail className="mr-2 h-5 w-5" />
            Support & Feedback
          </CardTitle>
          <CardDescription>
            We're here to help improve your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Have questions or suggestions? We'd love to hear from you!
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full btn-gradient border-none text-white hover:shadow-orange"
                onClick={() => window.open('mailto:sparksound2025@gmail.com?subject=SparkSounds Support Request', '_blank')}
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Support Team
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => window.open('mailto:sparksound2025@gmail.com?subject=SparkSounds Feedback', '_blank')}
              >
                <Heart className="mr-2 h-4 w-4" />
                Send Feedback
              </Button>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-center text-muted-foreground">
                <strong className="text-primary">sparksound2025@gmail.com</strong><br/>
                Our dedicated support team responds within 24 hours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version Info */}
      <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
        <p>SparkSounds v1.0.0</p>
        <p>Made with Dhaanish Visioners</p>
        <p className="max-w-xs mx-auto">
          This app is designed to enhance safety and awareness for the deaf and hard-of-hearing community.
        </p>
      </div>
    </div>
  );
};