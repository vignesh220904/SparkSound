import React, { createContext, useContext } from 'react';
import { useLanguage } from './LanguageContext';

interface AppTranslations {
  // Navigation
  home: string;
  detection: string;
  history: string;
  settings: string;
  about: string;
  
  // Home Page
  welcome: string;
  realTimeSoundAwareness: string;
  newMessages: string;
  pastMessages: string;
  languageControl: string;
  selectLanguage: string;
  
  // Messages
  newMessage: string;
  pastMessage: string;
  noNewMessages: string;
  noPastMessages: string;
  personal: string;
  broadcast: string;
  
  // Detection
  activelyListening: string;
  detectionPaused: string;
  realTimeMonitoring: string;
  tapToResume: string;
  liveDetection: string;
  recentDetections: string;
  noRecentDetections: string;
  
  // Emergency
  emergencyAlerts: string;
  viewAll: string;
  showLess: string;
  
  // History
  messageHistory: string;
  noMessagesFound: string;
  
  // Settings
  darkMode: string;
  notifications: string;
  soundSettings: string;
  
  // About
  appVersion: string;
  developedBy: string;
  appFeatures: string;
  howToUse: string;
  supportFeedback: string;
  
  // Common
  start: string;
  pause: string;
  dismiss: string;
  loading: string;
  error: string;
  success: string;
}

const translations: Record<string, AppTranslations> = {
  'en-US': {
    // Navigation
    home: 'Home',
    detection: 'Detection',
    history: 'History',
    settings: 'Settings',
    about: 'About',
    
    // Home Page
    welcome: 'Welcome to SparkSounds',
    realTimeSoundAwareness: 'Real-time sound awareness for everyone',
    newMessages: 'New Messages',
    pastMessages: 'Past Messages',
    languageControl: 'Language Control',
    selectLanguage: 'Select your preferred language',
    
    // Messages
    newMessage: 'New Message',
    pastMessage: 'Past Message',
    noNewMessages: 'No new messages',
    noPastMessages: 'No past messages',
    personal: 'Personal',
    broadcast: 'Broadcast',
    
    // Detection
    activelyListening: 'Actively Listening',
    detectionPaused: 'Detection Paused',
    realTimeMonitoring: 'Real-time environmental monitoring',
    tapToResume: 'Tap to resume monitoring',
    liveDetection: 'Live Detection',
    recentDetections: 'Recent Detections',
    noRecentDetections: 'No recent detections',
    
    // Emergency
    emergencyAlerts: 'Emergency Alerts',
    viewAll: 'View All',
    showLess: 'Show Less',
    
    // History
    messageHistory: 'Message History',
    noMessagesFound: 'No messages found',
    
    // Settings
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    soundSettings: 'Sound Settings',
    
    // About
    appVersion: 'App Version',
    developedBy: 'Developed by Dhaanish Visioners',
    appFeatures: 'App Features',
    howToUse: 'How to Use App',
    supportFeedback: 'Support & Feedback: sparksound2025@gmail.com',
    
    // Common
    start: 'Start',
    pause: 'Pause',
    dismiss: 'Dismiss',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  
  'ta-IN': {
    // Navigation
    home: 'முகப்பு',
    detection: 'கண்டறிதல்',
    history: 'வரலாறு',
    settings: 'அமைப்புகள்',
    about: 'பற்றி',
    
    // Home Page
    welcome: 'SparkSounds வரவேற்கிறது',
    realTimeSoundAwareness: 'அனைவருக்கும் நேரலை ஒலி விழிப்புணர்வு',
    newMessages: 'புதிய செய்திகள்',
    pastMessages: 'கடந்த செய்திகள்',
    languageControl: 'மொழி கட்டுப்பாடு',
    selectLanguage: 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    
    // Messages
    newMessage: 'புதிய செய்தி',
    pastMessage: 'கடந்த செய்தி',
    noNewMessages: 'புதிய செய்திகள் இல்லை',
    noPastMessages: 'கடந்த செய்திகள் இல்லை',
    personal: 'தனிப்பட்ட',
    broadcast: 'ஒளிபரப்பு',
    
    // Detection
    activelyListening: 'செயலில் கேட்கிறது',
    detectionPaused: 'கண்டறிதல் இடைநிறுத்தப்பட்டது',
    realTimeMonitoring: 'நேரலை சுற்றுச்சூழல் கண்காணிப்பு',
    tapToResume: 'கண்காணிப்பை மீண்டும் தொடங்க தட்டவும்',
    liveDetection: 'நேரலை கண்டறிதல்',
    recentDetections: 'சமீபத்திய கண்டறிதல்கள்',
    noRecentDetections: 'சமீபத்திய கண்டறிதல்கள் இல்லை',
    
    // Emergency
    emergencyAlerts: 'அவசர எச்சரிக்கைகள்',
    viewAll: 'அனைத்தையும் பார்க்கவும்',
    showLess: 'குறைவாக காட்டு',
    
    // History
    messageHistory: 'செய்தி வரலாறு',
    noMessagesFound: 'செய்திகள் எதுவும் கிடைக்கவில்லை',
    
    // Settings
    darkMode: 'இருண்ட பயன்முறை',
    notifications: 'அறிவிப்புகள்',
    soundSettings: 'ஒலி அமைப்புகள்',
    
    // About
    appVersion: 'பயன்பாட்டு பதிப்பு',
    developedBy: 'தானிஷ் விஷனர்ஸ் உருவாக்கியது',
    appFeatures: 'பயன்பாட்டு அம்சங்கள்',
    howToUse: 'பயன்பாட்டை எவ்வாறு பயன்படுத்துவது',
    supportFeedback: 'ஆதரவு மற்றும் கருத்து: sparksound2025@gmail.com',
    
    // Common
    start: 'தொடங்கு',
    pause: 'இடைநிறுத்து',
    dismiss: 'நிராகரி',
    loading: 'ஏற்றுகிறது...',
    error: 'பிழை',
    success: 'வெற்றி',
  },
  
  'hi-IN': {
    // Navigation
    home: 'होम',
    detection: 'डिटेक्शन',
    history: 'इतिहास',
    settings: 'सेटिंग्स',
    about: 'के बारे में',
    
    // Home Page
    welcome: 'SparkSounds में आपका स्वागत है',
    realTimeSoundAwareness: 'सभी के लिए रियल-टाइम साउंड अवेयरनेस',
    newMessages: 'नए संदेश',
    pastMessages: 'पुराने संदेश',
    languageControl: 'भाषा नियंत्रण',
    selectLanguage: 'अपनी पसंदीदा भाषा चुनें',
    
    // Messages
    newMessage: 'नया संदेश',
    pastMessage: 'पुराना संदेश',
    noNewMessages: 'कोई नए संदेश नहीं',
    noPastMessages: 'कोई पुराने संदेश नहीं',
    personal: 'व्यक्तिगत',
    broadcast: 'प्रसारण',
    
    // Detection
    activelyListening: 'सक्रिय रूप से सुन रहा है',
    detectionPaused: 'डिटेक्शन रोका गया',
    realTimeMonitoring: 'रियल-टाइम पर्यावरण निगरानी',
    tapToResume: 'निगरानी फिर से शुरू करने के लिए टैप करें',
    liveDetection: 'लाइव डिटेक्शन',
    recentDetections: 'हाल के डिटेक्शन',
    noRecentDetections: 'कोई हाल के डिटेक्शन नहीं',
    
    // Emergency
    emergencyAlerts: 'आपातकालीन अलर्ट',
    viewAll: 'सभी देखें',
    showLess: 'कम दिखाएं',
    
    // History
    messageHistory: 'संदेश इतिहास',
    noMessagesFound: 'कोई संदेश नहीं मिला',
    
    // Settings
    darkMode: 'डार्क मोड',
    notifications: 'नोटिफिकेशन',
    soundSettings: 'साउंड सेटिंग्स',
    
    // About
    appVersion: 'ऐप संस्करण',
    developedBy: 'धानिश विज़नर्स द्वारा विकसित',
    appFeatures: 'ऐप सुविधाएं',
    howToUse: 'ऐप का उपयोग कैसे करें',
    supportFeedback: 'सहायता और फीडबैक: sparksound2025@gmail.com',
    
    // Common
    start: 'शुरू करें',
    pause: 'रोकें',
    dismiss: 'बर्खास्त करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
  },
  
  'te-IN': {
    // Navigation
    home: 'హోమ్',
    detection: 'డిటెక్షన్',
    history: 'చరిత్ర',
    settings: 'సెట్టింగ్స్',
    about: 'గురించి',
    
    // Home Page
    welcome: 'SparkSounds కు స్వాగతం',
    realTimeSoundAwareness: 'అందరికీ రియల్-టైమ్ సౌండ్ అవగాహన',
    newMessages: 'కొత్త సందేశాలు',
    pastMessages: 'పాత సందేశాలు',
    languageControl: 'భాష నియంత్రణ',
    selectLanguage: 'మీ ఇష్టమైన భాషను ఎంచుకోండి',
    
    // Messages
    newMessage: 'కొత్త సందేశం',
    pastMessage: 'పాత సందేశం',
    noNewMessages: 'కొత్త సందేశాలు లేవు',
    noPastMessages: 'పాత సందేశాలు లేవు',
    personal: 'వ్యక్తిగత',
    broadcast: 'ప్రసారం',
    
    // Detection
    activelyListening: 'చురుకుగా వింటోంది',
    detectionPaused: 'డిటెక్షన్ పాజ్ చేయబడింది',
    realTimeMonitoring: 'రియల్-టైమ్ పర్యావరణ పర్యవేక్షణ',
    tapToResume: 'పర్యవేక్షణను తిరిగి ప్రారంభించడానికి టాప్ చేయండి',
    liveDetection: 'లైవ్ డిటెక్షన్',
    recentDetections: 'ఇటీవలి డిటెక్షన్లు',
    noRecentDetections: 'ఇటీవలి డిటెక్షన్లు లేవు',
    
    // Emergency
    emergencyAlerts: 'అత్యవసర హెచ్చరికలు',
    viewAll: 'అన్నీ చూడండి',
    showLess: 'తక్కువ చూపించు',
    
    // History
    messageHistory: 'సందేశ చరిత్ర',
    noMessagesFound: 'సందేశాలు కనుగొనబడలేదు',
    
    // Settings
    darkMode: 'డార్క్ మోడ్',
    notifications: 'నోటిఫికేషన్లు',
    soundSettings: 'సౌండ్ సెట్టింగ్స్',
    
    // About
    appVersion: 'యాప్ వెర్షన్',
    developedBy: 'ధానిష్ విజనర్స్ చే అభివృద్ధి చేయబడింది',
    appFeatures: 'యాప్ లక్షణాలు',
    howToUse: 'యాప్‌ను ఎలా ఉపయోగించాలి',
    supportFeedback: 'మద్దతు మరియు అభిప్రాయం: sparksound2025@gmail.com',
    
    // Common
    start: 'ప్రారంభించు',
    pause: 'పాజ్',
    dismiss: 'తీసివేయు',
    loading: 'లోడ్ అవుతోంది...',
    error: 'లోపం',
    success: 'విజయం',
  },
  
  'kn-IN': {
    // Navigation
    home: 'ಮುಖ್ಯಪುಟ',
    detection: 'ಪತ್ತೆ',
    history: 'ಇತಿಹಾಸ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    about: 'ಬಗ್ಗೆ',
    
    // Home Page
    welcome: 'SparkSounds ಗೆ ಸ್ವಾಗತ',
    realTimeSoundAwareness: 'ಎಲ್ಲರಿಗೂ ನೈಜ-ಸಮಯದ ಧ್ವನಿ ಅರಿವು',
    newMessages: 'ಹೊಸ ಸಂದೇಶಗಳು',
    pastMessages: 'ಹಿಂದಿನ ಸಂದೇಶಗಳು',
    languageControl: 'ಭಾಷಾ ನಿಯಂತ್ರಣ',
    selectLanguage: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ',
    
    // Messages
    newMessage: 'ಹೊಸ ಸಂದೇಶ',
    pastMessage: 'ಹಿಂದಿನ ಸಂದೇಶ',
    noNewMessages: 'ಹೊಸ ಸಂದೇಶಗಳಿಲ್ಲ',
    noPastMessages: 'ಹಿಂದಿನ ಸಂದೇಶಗಳಿಲ್ಲ',
    personal: 'ವೈಯಕ್ತಿಕ',
    broadcast: 'ಪ್ರಸಾರ',
    
    // Detection
    activelyListening: 'ಸಕ್ರಿಯವಾಗಿ ಕೇಳುತ್ತಿದೆ',
    detectionPaused: 'ಪತ್ತೆ ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ',
    realTimeMonitoring: 'ನೈಜ-ಸಮಯದ ಪರಿಸರ ಮೇಲ್ವಿಚಾರಣೆ',
    tapToResume: 'ಮೇಲ್ವಿಚಾರಣೆಯನ್ನು ಪುನರಾರಂಭಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    liveDetection: 'ಲೈವ್ ಪತ್ತೆ',
    recentDetections: 'ಇತ್ತೀಚಿನ ಪತ್ತೆಗಳು',
    noRecentDetections: 'ಇತ್ತೀಚಿನ ಪತ್ತೆಗಳಿಲ್ಲ',
    
    // Emergency
    emergencyAlerts: 'ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳು',
    viewAll: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
    showLess: 'ಕಡಿಮೆ ತೋರಿಸಿ',
    
    // History
    messageHistory: 'ಸಂದೇಶ ಇತಿಹಾಸ',
    noMessagesFound: 'ಯಾವುದೇ ಸಂದೇಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    
    // Settings
    darkMode: 'ಡಾರ್ಕ್ ಮೋಡ್',
    notifications: 'ಅಧಿಸೂಚನೆಗಳು',
    soundSettings: 'ಧ್ವನಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    
    // About
    appVersion: 'ಅಪ್ಲಿಕೇಶನ್ ಆವೃತ್ತಿ',
    developedBy: 'ಧಾನಿಶ್ ವಿಷನರ್ಸ್ ಅಭಿವೃದ್ಧಿಪಡಿಸಿದೆ',
    appFeatures: 'ಅಪ್ಲಿಕೇಶನ್ ವೈಶಿಷ್ಟ್ಯಗಳು',
    howToUse: 'ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಹೇಗೆ ಬಳಸುವುದು',
    supportFeedback: 'ಬೆಂಬಲ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ: sparksound2025@gmail.com',
    
    // Common
    start: 'ಪ್ರಾರಂಭಿಸಿ',
    pause: 'ವಿರಾಮ',
    dismiss: 'ವಜಾಗೊಳಿಸಿ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    error: 'ದೋಷ',
    success: 'ಯಶಸ್ಸು',
  },
  
  'ml-IN': {
    // Navigation
    home: 'ഹോം',
    detection: 'കണ്ടെത്തൽ',
    history: 'ചരിത്രം',
    settings: 'ക്രമീകരണങ്ങൾ',
    about: 'കുറിച്ച്',
    
    // Home Page
    welcome: 'SparkSounds വിലേക്ക് സ്വാഗതം',
    realTimeSoundAwareness: 'എല്ലാവർക്കും തത്സമയ ശബ്ദ അവബോധം',
    newMessages: 'പുതിയ സന്ദേശങ്ങൾ',
    pastMessages: 'പഴയ സന്ദേശങ്ങൾ',
    languageControl: 'ഭാഷാ നിയന്ത്രണം',
    selectLanguage: 'നിങ്ങളുടെ ഇഷ്ടമുള്ള ഭാഷ തിരഞ്ഞെടുക്കുക',
    
    // Messages
    newMessage: 'പുതിയ സന്ദേശം',
    pastMessage: 'പഴയ സന്ദേശം',
    noNewMessages: 'പുതിയ സന്ദേശങ്ങളില്ല',
    noPastMessages: 'പഴയ സന്ദേശങ്ങളില്ല',
    personal: 'വ്യക്തിഗത',
    broadcast: 'പ്രക്ഷേപണം',
    
    // Detection
    activelyListening: 'സജീവമായി കേൾക്കുന്നു',
    detectionPaused: 'കണ്ടെത്തൽ താൽക്കാലികമായി നിർത്തി',
    realTimeMonitoring: 'തത്സമയ പരിസ്ഥിതി നിരീക്ഷണം',
    tapToResume: 'നിരീക്ഷണം പുനരാരംഭിക്കാൻ ടാപ്പ് ചെയ്യുക',
    liveDetection: 'ലൈവ് കണ്ടെത്തൽ',
    recentDetections: 'സമീപകാല കണ്ടെത്തലുകൾ',
    noRecentDetections: 'സമീപകാല കണ്ടെത്തലുകളില്ല',
    
    // Emergency
    emergencyAlerts: 'എമർജൻസി അലേർട്ടുകൾ',
    viewAll: 'എല്ലാം കാണുക',
    showLess: 'കുറവ് കാണിക്കുക',
    
    // History
    messageHistory: 'സന്ദേശ ചരിത്രം',
    noMessagesFound: 'സന്ദേശങ്ങളൊന്നും കണ്ടെത്തിയില്ല',
    
    // Settings
    darkMode: 'ഡാർക്ക് മോഡ്',
    notifications: 'അറിയിപ്പുകൾ',
    soundSettings: 'ശബ്ദ ക്രമീകരണങ്ങൾ',
    
    // About
    appVersion: 'ആപ്പ് പതിപ്പ്',
    developedBy: 'ധാനിഷ് വിഷനേഴ്സ് വികസിപ്പിച്ചത്',
    appFeatures: 'ആപ്പ് സവിശേഷതകൾ',
    howToUse: 'ആപ്പ് എങ്ങനെ ഉപയോഗിക്കാം',
    supportFeedback: 'പിന്തുണയും ഫീഡ്ബാക്കും: sparksound2025@gmail.com',
    
    // Common
    start: 'ആരംഭിക്കുക',
    pause: 'താൽക്കാലികമായി നിർത്തുക',
    dismiss: 'നിരസിക്കുക',
    loading: 'ലോഡ് ചെയ്യുന്നു...',
    error: 'പിശക്',
    success: 'വിജയം',
  },
};

const AppTranslationsContext = createContext<AppTranslations | null>(null);

export const useAppTranslations = (): AppTranslations => {
  const context = useContext(AppTranslationsContext);
  if (!context) {
    throw new Error('useAppTranslations must be used within AppTranslationsProvider');
  }
  return context;
};

interface AppTranslationsProviderProps {
  children: React.ReactNode;
}

export const AppTranslationsProvider: React.FC<AppTranslationsProviderProps> = ({ children }) => {
  const { language } = useLanguage();
  
  const currentTranslations = translations[language] || translations['en-US'];

  return (
    <AppTranslationsContext.Provider value={currentTranslations}>
      {children}
    </AppTranslationsContext.Provider>
  );
};