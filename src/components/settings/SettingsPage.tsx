import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User, Bell, Moon, Shield, HelpCircle, LogOut, Watch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GOAL_OPTIONS } from '@/types/wellness';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const;

export function SettingsPage() {
  const navigate = useNavigate();
  const { setActiveTab, profile, setProfile, reset } = useAppStore();
  const { user, signOut } = useAuth();
  
  const [age, setAge] = useState(profile?.age || 25);
  const [gender, setGender] = useState<typeof GENDER_OPTIONS[number]>(profile?.gender || 'Prefer not to say');
  const [goals, setGoals] = useState<string[]>(profile?.goals || []);
  const [notifications, setNotifications] = useState(profile?.notifications ?? true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setAge(profile.age);
      setGender(profile.gender);
      setGoals(profile.goals);
      setNotifications(profile.notifications);
    }
  }, [profile]);

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Save to Supabase if configured
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            age,
            gender,
            goals,
            notifications,
          }, {
            onConflict: 'id'
          });
        
        if (error) throw error;
      }
      
      setProfile({
        ...profile,
        age,
        gender,
        goals,
        notifications,
        updated_at: new Date().toISOString(),
      });
      
      toast({
        title: "Profile Saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      reset();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setActiveTab('home')}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Settings</h1>
      </div>

      {/* User Profile Card */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">User Profile</p>
            <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Age */}
      <div className="glass-card p-4">
        <label className="text-sm font-medium text-foreground">Age</label>
        <Input
          type="number"
          value={age}
          onChange={(e) => setAge(parseInt(e.target.value) || 0)}
          min={16}
          max={100}
          className="mt-2 bg-secondary/50 border-border/50"
        />
      </div>

      {/* Identity Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Identity
        </h2>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Gender Identity</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setGender(option)}
                className={cn(
                  "rounded-xl py-3 text-sm transition-all",
                  gender === option
                    ? "bg-primary/10 text-primary border border-primary/50"
                    : "bg-secondary text-muted-foreground border border-transparent hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Goals
        </h2>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🎯</span>
            <span className="text-sm font-medium text-foreground">What are you optimizing for?</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl py-3 px-4 text-sm transition-all",
                  goals.includes(goal.id)
                    ? "bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/50"
                    : "bg-secondary text-muted-foreground border border-transparent hover:text-foreground"
                )}
              >
                <span>{goal.emoji}</span>
                <span>{goal.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Integrations
        </h2>
        
        <div className="glass-card">
          <button className="flex w-full items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Watch className="h-5 w-5 text-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Wearables</p>
                <p className="text-xs text-muted-foreground">Connect fitness devices</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preferences
        </h2>
        
        <div className="glass-card divide-y divide-border/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Notifications</span>
            </div>
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Dark Mode</span>
            </div>
            <Switch checked={true} disabled />
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Support
        </h2>
        
        <div className="glass-card divide-y divide-border/50">
          <button className="flex w-full items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Privacy & Data</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <button className="flex w-full items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Help & FAQ</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl"
      >
        {isSaving ? 'Saving...' : 'Save Profile'}
      </Button>

      {/* Sign Out */}
      <button 
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 py-4 text-rose-400 hover:text-rose-300 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">Sign Out</span>
      </button>
    </div>
  );
}
