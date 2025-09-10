import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppTranslations } from '@/contexts/AppTranslations';

const languages = [
  { code: 'en-IN', name: 'English', nativeName: 'English' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const t = useAppTranslations();

  return (
    <Card className="bg-muted/30 border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-sm font-medium">
          <Languages className="mr-2 h-4 w-4 text-muted-foreground" />
          {t.languageControl}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-1">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={language === lang.code ? "default" : "ghost"}
              size="sm"
              onClick={() => setLanguage(lang.code)}
              className={`h-8 px-2 text-xs ${
                language === lang.code 
                  ? "bg-primary text-primary-foreground text-xs" 
                  : "hover:bg-primary/10 text-muted-foreground"
              }`}
            >
              <div className="text-center">
                <div className="font-medium">{lang.nativeName}</div>
              </div>
              {language === lang.code && (
                <Check className="h-3 w-3 ml-1 shrink-0" />
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};