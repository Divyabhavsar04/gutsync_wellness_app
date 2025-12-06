import { useState, useEffect } from 'react';
import { ChevronLeft, Sparkles, Lightbulb, TrendingUp, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { HormoneRadar } from './HormoneRadar';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { StressVsSleepChart } from './StressVsSleepChart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  calculateMoodScore, 
  calculateEnergyForecast, 
  calculateHormoneStability, 
  calculateWellnessScore,
  getWellnessCategory 
} from '@/lib/wellness-calculations';

export function InsightsPage() {
  const { setActiveTab, logs, profile, aiRecommendation, aiKeyPattern, setAIInsights } = useAppStore();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hormoneData, setHormoneData] = useState({
    dopamine: 65, cortisol: 70, estrogen: 55, testosterone: 60, melatonin: 50, serotonin: 68,
  });
  const [moodScore, setMoodScore] = useState(75);
  const [energyForecast, setEnergyForecast] = useState(80);
  const [wellnessScore, setWellnessScore] = useState(70);

  // Calculate all metrics from logs
  useEffect(() => {
    if (logs.length > 0 && profile) {
      const latestLog = logs[0];
      const calculated = calculateHormoneStability(latestLog, { age: profile.age, gender: profile.gender });
      setHormoneData({
        dopamine: calculated.dopamine,
        cortisol: calculated.cortisol,
        estrogen: calculated.estrogen,
        testosterone: calculated.testosterone,
        melatonin: calculated.melatonin,
        serotonin: calculated.serotonin,
      });
      setMoodScore(calculateMoodScore(latestLog));
      setEnergyForecast(calculateEnergyForecast(latestLog, logs.slice(1)));
      setWellnessScore(calculateWellnessScore(latestLog, calculated));
    }
  }, [logs, profile]);

  // Fetch AI insights
  useEffect(() => {
    const fetchAIInsights = async () => {
      if (logs.length === 0 || !profile || aiRecommendation) return;
      
      // Skip if Supabase is not configured
      if (!supabase) {
        setIsLoadingAI(false);
        return;
      }
      
      setIsLoadingAI(true);
      try {
        const { data, error } = await supabase.functions.invoke('ai-insights', {
          body: {
            dailyLog: logs[0],
            hormoneData,
            moodScore,
            energyForecast,
            wellnessScore,
            profile,
          },
        });

        if (error) throw error;
        if (data?.recommendation) {
          setAIInsights(data.recommendation, data.key_pattern || 'Continue tracking to identify patterns.');
        }
      } catch (error: any) {
        if (error?.message?.includes('Insufficient credits') || error?.status === 402) {
          toast({ title: 'Insufficient credits', description: 'Please check your API quota.', variant: 'destructive' });
        }
      } finally {
        setIsLoadingAI(false);
      }
    };

    fetchAIInsights();
  }, [logs, profile, hormoneData, moodScore, energyForecast, wellnessScore]);

  const wellnessCategory = getWellnessCategory(wellnessScore);
  const getCategoryColor = () => {
    switch (wellnessCategory) {
      case 'Healthy': return 'text-emerald-400';
      case 'Moderate': return 'text-amber-400';
      case 'Concern': return 'text-orange-400';
      case 'Severe': return 'text-rose-400';
      default: return 'text-muted-foreground';
    }
  };

  const recommendation = aiRecommendation || "Log your daily wellness data to receive personalized AI recommendations.";
  const keyPattern = aiKeyPattern || "Continue logging to identify patterns in your wellness data.";

  const displayTrends = logs.length > 0 
    ? logs.slice(0, 7).map(log => {
        const date = new Date(log.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const hd = calculateHormoneStability(log, { age: profile?.age || 25, gender: profile?.gender || 'Prefer not to say' });
        return { date: dayName, wellness_score: calculateWellnessScore(log, hd), mood_score: calculateMoodScore(log), stress_level: log.stress_level * 10, sleep_hours: log.sleep_hours };
      }).reverse()
    : [{ date: 'Mon', wellness_score: 72, mood_score: 70, stress_level: 35, sleep_hours: 7 }, { date: 'Tue', wellness_score: 75, mood_score: 72, stress_level: 30, sleep_hours: 7.5 }, { date: 'Wed', wellness_score: 78, mood_score: 75, stress_level: 28, sleep_hours: 8 }, { date: 'Thu', wellness_score: 80, mood_score: 78, stress_level: 25, sleep_hours: 7 }, { date: 'Fri', wellness_score: 76, mood_score: 74, stress_level: 32, sleep_hours: 6.5 }, { date: 'Sat', wellness_score: 82, mood_score: 80, stress_level: 22, sleep_hours: 8.5 }, { date: 'Sun', wellness_score: 85, mood_score: 82, stress_level: 20, sleep_hours: 8 }];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('home')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">AI Insights</h1>
          <p className="text-sm text-muted-foreground">Personalized predictions & analysis</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Your Wellness Score</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-foreground">{wellnessScore}</span>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className={`font-medium ${getCategoryColor()}`}>
            {wellnessCategory === 'Healthy' && 'Excellent wellness status'}
            {wellnessCategory === 'Moderate' && 'Stable but Needs Monitoring'}
            {wellnessCategory === 'Concern' && 'Attention Required'}
            {wellnessCategory === 'Severe' && 'Immediate Action Recommended'}
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            {isLoadingAI ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <Lightbulb className="h-4 w-4 text-primary" />}
            <span className="text-sm font-medium text-primary">Personalized Recommendation</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{recommendation}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <span className="font-medium text-foreground">Mood Trend</span>
          <div className="ml-auto flex items-center gap-1 text-sm text-emerald-400">
            <TrendingUp className="h-4 w-4" /><span>+18% this week</span>
          </div>
        </div>
        <TrendChart data={displayTrends} dataKey="mood_score" title="" color="hsl(var(--primary))" />
      </div>

      <HormoneRadar data={hormoneData} />
      <StressVsSleepChart />

      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Key Pattern Detected</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{keyPattern}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
