import { NewAnnouncementBox } from '@/components/NewAnnouncementBox';
import { PastAnnouncementsBox } from '@/components/PastAnnouncementsBox';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAppTranslations } from '@/contexts/AppTranslations';
import type { User } from "@supabase/supabase-js";

interface IndexProps {
  user: User | null;
}

const Index = ({ user }: IndexProps) => {
  const t = useAppTranslations();
  
  const handleMarkAnnouncementAsRead = (id: string) => {
    // Handle marking announcement as read
    console.log('Marking announcement as read:', id);
  };

  return (
    <div className="pb-20 px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
       
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
          Spark Sound
        </h1>
        <p className="text-lg text-muted-foreground mb-4">{t.realTimeSoundAwareness}</p>
      </div>

      {/* Language Control */}
      <LanguageSelector />

      {/* New Announcement Box */}
      <NewAnnouncementBox user={user} onMarkAsRead={handleMarkAnnouncementAsRead} />

      {/* Past Announcements Box */}
      <PastAnnouncementsBox user={user} />
    </div>
  );
};

export default Index;
