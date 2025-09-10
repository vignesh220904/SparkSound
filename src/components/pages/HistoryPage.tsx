import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Search, 
  Filter, 
  Volume2, 
  Clock, 
  MessageSquare,
  Calendar,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { User } from "@supabase/supabase-js";

interface HistoryItem {
  id: string;
  original_text: string;
  translated_text: string | null;
  created_at: string;
  target_user_id: string | null;
}

interface HistoryPageProps {
  user: User | null;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ user }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (currentUserProfile) {
      fetchHistory();
    }
  }, [currentUserProfile]);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, filterType, dateFilter]);

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

  const fetchHistory = async () => {
    if (!currentUserProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('instructions')
        .select('id, original_text, translated_text, created_at, target_user_id')
        .or(`target_user_id.eq.${currentUserProfile.id},target_user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to fetch message history');
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.original_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.translated_text && item.translated_text.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => {
        if (filterType === 'personal') return item.target_user_id !== null;
        if (filterType === 'broadcast') return item.target_user_id === null;
        return true;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        if (dateFilter === 'today') {
          return itemDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        }
        if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= monthAgo;
        }
        return true;
      });
    }

    setFilteredHistory(filtered);
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      const langMap: Record<string, string> = {
        'en-US': 'en-US',
        'hi-IN': 'hi-IN',
        'te-IN': 'te-IN',
        'ta-IN': 'ta-IN',
        'kn-IN': 'kn-IN',
        'ml-IN': 'ml-IN'
      };
      utterance.lang = langMap[language] || 'en-US';
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return;
    }

    try {
      // Note: In a real app, you might want to soft-delete or have user-specific history
      toast.info('History cleared locally');
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  if (loading) {
    return (
      <div className="pb-20 px-4 pt-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-muted-foreground">Loading message history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-orange">
          <History className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">Message History</h1>
        <p className="text-muted-foreground">All your received announcements</p>
      </div>

      {/* Filters */}
      <Card className="card-enhanced">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="broadcast">Broadcast</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center">
            <Badge variant="secondary">
              {filteredHistory.length} messages found
            </Badge>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHistory}
                className="h-8"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card className="card-enhanced">
          <CardContent className="py-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterType !== 'all' || dateFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'No message history available'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, index) => (
            <Card key={item.id} className={`card-enhanced ${index === 0 ? 'border-primary/50' : ''}`}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.translated_text || item.original_text}
                      </p>
                      
                      {item.translated_text && item.translated_text !== item.original_text && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Original: {item.original_text}
                        </p>
                      )}
                    </div>
                    
                    <Badge 
                      variant={item.target_user_id ? "default" : "outline"}
                      className="ml-2 text-xs"
                    >
                      {item.target_user_id ? 'Personal' : 'Broadcast'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakMessage(item.translated_text || item.original_text)}
                      className="h-7 px-2 hover:bg-primary/20"
                    >
                      <Volume2 className="h-3 w-3 text-primary" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};