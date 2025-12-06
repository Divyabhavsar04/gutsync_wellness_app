import { useEffect, useState } from 'react';
import { Smile, Activity, Brain, Zap, TrendingUp, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { MetricCard } from '@/components/ui/metric-card';
import { WellnessGauge, WellnessScoreBar } from '@/components/ui/wellness-gauge';
import { TrendChart } from './TrendChart';
import { Button } from '@/components/ui/button';
import { 
  calculateMoodScore, 
  calculateEnergyForecast, 
  calculateHormoneStability, 
  calculateWellnessScore 
} from '@/lib/wellness-calculations';

export function Dashboard() {
  const { latestPrediction, trends, setActiveTab, logs, profile } = useAppStore();
  const [moodScore, setMoodScore] = useState(75);
  const [energyForecast, setEnergyForecast] = useState(80);
  const [hormoneBalance, setHormoneBalance] = useState(70);
  const [wellnessScore, setWellnessScore] = useState(75);

  // Calculate scores based on latest log
  useEffect(() => {
    if (logs.length > 0 && profile) {
      const latestLog = logs[0];
      const hormoneData = calculateHormoneStability(latestLog, { 
        age: profile.age, 
        gender: profile.gender 
      });
      
      const calculatedMoodScore = calculateMoodScore(latestLog);
      const calculatedEnergyForecast = calculateEnergyForecast(latestLog, logs.slice(1));
      const calculatedWellnessScore = calculateWellnessScore(latestLog, hormoneData);
      const avgHormone = Math.round((hormoneData.cortisol + hormoneData.serotonin + hormoneData.dopamine + hormoneData.melatonin + hormoneData.estrogen + hormoneData.testosterone) / 6);
      
      setMoodScore(calculatedMoodScore);
      setEnergyForecast(calculatedEnergyForecast);
      setHormoneBalance(avgHormone);
      setWellnessScore(calculatedWellnessScore);
    } else if (latestPrediction) {
      setWellnessScore(latestPrediction.wellness_score);
      if (latestPrediction.hormone_stability) {
        const avg = Math.round(
          Object.values(latestPrediction.hormone_stability).reduce((a, b) => a + b, 0) / 6
        );
        setHormoneBalance(avg);
      }
    }
  }, [logs, profile, latestPrediction]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate stress level from latest log
  const stressLevel = logs.length > 0 
    ? logs[0].stress_level * 10 
    : (latestPrediction?.stress_vs_sleep_score 
        ? Math.round(100 - latestPrediction.stress_vs_sleep_score) 
        : 28);

  // Generate trend data from logs
  const displayTrends = logs.length > 0 
    ? logs.slice(0, 7).map(log => {
        const date = new Date(log.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const hormoneData = calculateHormoneStability(log, { 
          age: profile?.age || 25, 
          gender: profile?.gender || 'Prefer not to say' 
        });
        return {
          date: dayName,
          wellness_score: calculateWellnessScore(log, hormoneData),
          mood_score: calculateMoodScore(log),
          stress_level: log.stress_level * 10,
          sleep_hours: log.sleep_hours,
        };
      }).reverse()
    : [
        { date: 'Mon', wellness_score: 72, mood_score: 70, stress_level: 35, sleep_hours: 7 },
        { date: 'Tue', wellness_score: 75, mood_score: 72, stress_level: 30, sleep_hours: 7.5 },
        { date: 'Wed', wellness_score: 78, mood_score: 75, stress_level: 28, sleep_hours: 8 },
        { date: 'Thu', wellness_score: 80, mood_score: 78, stress_level: 25, sleep_hours: 7 },
        { date: 'Fri', wellness_score: 76, mood_score: 74, stress_level: 32, sleep_hours: 6.5 },
        { date: 'Sat', wellness_score: 82, mood_score: 80, stress_level: 22, sleep_hours: 8.5 },
        { date: 'Sun', wellness_score: 85, mood_score: 82, stress_level: 20, sleep_hours: 8 },
      ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Dashboard
          </h1>
        </div>
        <Button
          onClick={() => setActiveTab('log')}
          size="icon"
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Logo */}
      <div className="flex justify-center md:hidden">
        <h2 className="font-display text-3xl font-bold gradient-text">GUTSYNC</h2>
      </div>

      {/* Sync Status */}
      <WellnessGauge score={wellnessScore} />

      {/* Key Metrics */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Key Metrics</h2>
          <button 
            onClick={() => setActiveTab('insights')}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <MetricCard
            title="Mood Score"
            value={moodScore}
            suffix="/100"
            icon={Smile}
            trend={logs.length > 1 ? Math.round((moodScore - calculateMoodScore(logs[1]))) : 5}
            variant="primary"
          />
          <MetricCard
            title="Hormone Balance"
            value={hormoneBalance}
            suffix="%"
            icon={Activity}
            variant="success"
          />
          <MetricCard
            title="Stress Level"
            value={stressLevel}
            suffix="/100"
            icon={Brain}
            trend={-12}
            variant="warning"
          />
          <MetricCard
            title="Energy Forecast"
            value={energyForecast}
            suffix="%"
            icon={Zap}
            trend={8}
            variant="primary"
          />
        </div>
      </div>

      {/* Wellness Score Bar */}
      <WellnessScoreBar 
        score={wellnessScore} 
        label="Overall Wellness Status" 
      />

      {/* 7-Day Trends */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">7-Day Trends</h2>
          <div className="flex items-center gap-1 text-sm text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span>Improving</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <TrendChart 
            data={displayTrends} 
            dataKey="mood_score" 
            title="Mood Trend"
            color="hsl(var(--primary))"
            trend={12}
          />
          <TrendChart 
            data={displayTrends} 
            dataKey="stress_level" 
            title="Stress Trend"
            color="hsl(142 70% 45%)"
            trend={-18}
          />
        </div>
      </div>

      {/* Log CTA */}
      <Button
        onClick={() => setActiveTab('log')}
        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity"
      >
        <Plus className="mr-2 h-5 w-5" />
        Log Daily Inputs
      </Button>
    </div>
  );
}
