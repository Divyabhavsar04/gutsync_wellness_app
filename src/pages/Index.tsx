import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { DailyLogPage } from '@/components/log/DailyLog';
import { InsightsPage } from '@/components/insights/InsightsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { activeTab, profile, setProfile, setUserId, setLogs } = useAppStore();
  const { user } = useAuth();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load user profile and logs from database
  useEffect(() => {
    if (!user) return;
    
    // If Supabase is not configured, use default profile
    if (!supabase) {
      setProfile({
        id: user.id,
        email: user.email || undefined,
        age: 25,
        gender: 'Prefer not to say',
        goals: ['productivity'],
        notifications: true,
      });
      setUserId(user.id);
      setIsLoadingProfile(false);
      return;
    }

    const loadUserData = async () => {
      setIsLoadingProfile(true);
      try {
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error loading profile:', profileError);
        }

        if (profileData) {
          setProfile({
            id: profileData.id,
            email: profileData.email,
            age: profileData.age,
            gender: profileData.gender as 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say',
            goals: profileData.goals || [],
            notifications: profileData.notifications,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at,
          });
        } else {
          // Set default profile for new users
          setProfile({
            id: user.id,
            email: user.email,
            age: 25,
            gender: 'Prefer not to say',
            goals: ['productivity'],
            notifications: true,
          });
        }
        setUserId(user.id);

        // Load daily logs
        const { data: logsData, error: logsError } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30);

        if (logsError) {
          console.error('Error loading logs:', logsError);
        } else if (logsData) {
          const formattedLogs = logsData.map(log => ({
            id: log.id,
            user_id: log.user_id,
            date: log.date,
            sleep_hours: Number(log.sleep_hours),
            stress_level: log.stress_level,
            stress_cause: log.stress_cause,
            mood_category: log.mood_category as 'Low' | 'Meh' | 'Okay' | 'Good' | 'Great',
            energy_level: log.energy_level as 'Exhausted' | 'Low' | 'Moderate' | 'High' | 'Peak',
            caffeine_intake: log.caffeine_intake,
            healthy_diet: log.healthy_diet,
            exercise_done: log.exercise_done,
            menstrual_phase: log.menstrual_phase as 'NONE' | 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal',
            symptoms: log.symptoms as {
              fatigue: boolean;
              bloating: boolean;
              anxiety: boolean;
              brain_fog: boolean;
              insomnia: boolean;
              cramps: boolean;
              joint_pain: boolean;
            },
            created_at: log.created_at,
          }));
          setLogs(formattedLogs);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your data. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserData();
  }, [user, setProfile, setUserId, setLogs]);

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-display text-3xl font-bold gradient-text">GUTSYNC</h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your wellness data...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'log':
        return <DailyLogPage />;
      case 'insights':
        return <InsightsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout>
      {renderPage()}
    </AppLayout>
  );
};

export default Index;
