import { useState } from 'react';
import { ChevronLeft, Moon, Activity, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  DailyLog as DailyLogType, 
  MOOD_OPTIONS, 
  ENERGY_OPTIONS, 
  MENSTRUAL_PHASES,
  SYMPTOMS_LIST 
} from '@/types/wellness';
import { cn } from '@/lib/utils';
import { Coffee, Salad, Dumbbell } from 'lucide-react';
import { api } from '@/lib/api';

export function DailyLogPage() {
  const { profile, setActiveTab, setLatestPrediction, addLog, setIsLoading, isLoading } = useAppStore();
  const { user } = useAuth();
  
  const [sleepHours, setSleepHours] = useState(7);
  const [stressLevel, setStressLevel] = useState(4);
  const [stressCause, setStressCause] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('Okay');
  const [selectedEnergy, setSelectedEnergy] = useState<string>('Moderate');
  const [caffeine, setCaffeine] = useState(false);
  const [healthyDiet, setHealthyDiet] = useState(false);
  const [exercise, setExercise] = useState(false);
  const [menstrualPhase, setMenstrualPhase] = useState<string>('NONE');
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({
    fatigue: false,
    bloating: false,
    anxiety: false,
    brain_fog: false,
    insomnia: false,
    cramps: false,
    joint_pain: false,
  });

  // Lock menstrual phase for males
  const isMale = profile?.gender === 'Male';

  const toggleSymptom = (key: string) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!profile) {
      toast({
        title: "Profile Required",
        description: "Please set up your profile first.",
        variant: "destructive",
      });
      setActiveTab('settings');
      return;
    }

    setIsLoading(true);

    const log: DailyLogType = {
      user_id: user?.id,
      date: new Date().toISOString().split('T')[0],
      sleep_hours: sleepHours,
      stress_level: stressLevel,
      stress_cause: stressCause,
      mood_category: selectedMood as DailyLogType['mood_category'],
      energy_level: selectedEnergy as DailyLogType['energy_level'],
      caffeine_intake: caffeine,
      healthy_diet: healthyDiet,
      exercise_done: exercise,
      menstrual_phase: isMale ? 'NONE' : menstrualPhase as DailyLogType['menstrual_phase'],
      symptoms: {
        fatigue: symptoms.fatigue,
        bloating: symptoms.bloating,
        anxiety: symptoms.anxiety,
        brain_fog: symptoms.brain_fog,
        insomnia: symptoms.insomnia,
        cramps: symptoms.cramps,
        joint_pain: symptoms.joint_pain,
      },
    };

    try {
      const prediction = await api.getPrediction(log, profile);
      setLatestPrediction(prediction);
      addLog(log);
      
      // Save to Supabase if configured and user is authenticated
      if (supabase && user) {
        try {
          const { error: supabaseError } = await supabase
            .from('daily_logs')
            .upsert({
              user_id: user.id,
              date: log.date,
              sleep_hours: log.sleep_hours,
              stress_level: log.stress_level,
              stress_cause: log.stress_cause || null,
              mood_category: log.mood_category,
              energy_level: log.energy_level,
              caffeine_intake: log.caffeine_intake,
              healthy_diet: log.healthy_diet,
              exercise_done: log.exercise_done,
              menstrual_phase: log.menstrual_phase,
              symptoms: log.symptoms,
            }, {
              onConflict: 'user_id,date'
            });
          
          if (supabaseError) {
            console.error('Error saving log to Supabase:', supabaseError);
            // Don't show error to user, just log it
          }
        } catch (dbError) {
          console.error('Error saving log to database:', dbError);
          // Continue even if database save fails
        }
      }
      
      toast({
        title: "Prediction Generated!",
        description: `Your wellness score is ${prediction.wellness_score}/100`,
      });
      
      setActiveTab('insights');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Insufficient credits')) {
          toast({
            title: "Insufficient Credits",
            description: "Please check your API quota.",
            variant: "destructive",
          });
        } else {
          // For demo, generate mock prediction
          const mockPrediction = {
            wellness_score: Math.floor(Math.random() * 40) + 50,
            wellness_category: 'Moderate' as const,
            stress_vs_sleep_score: Math.floor(Math.random() * 30) + 10,
            hormone_stability: {
              dopamine: Math.floor(Math.random() * 30) + 60,
              cortisol: Math.floor(Math.random() * 30) + 50,
              estrogen: Math.floor(Math.random() * 30) + 50,
              testosterone: Math.floor(Math.random() * 30) + 50,
              melatonin: Math.floor(Math.random() * 30) + 50,
              serotonin: Math.floor(Math.random() * 30) + 60,
            },
            recommendation: "Based on your inputs, focus on getting more quality sleep and consider reducing caffeine intake.",
            key_pattern: "Your mood consistently improves 24-48 hours after getting 7+ hours of sleep.",
          };
          
          setLatestPrediction(mockPrediction);
          addLog(log);
          
          toast({
            title: "Prediction Generated!",
            description: `Your wellness score is ${mockPrediction.wellness_score}/100 (Demo mode)`,
          });
          
          setActiveTab('insights');
        }
      }
    } finally {
      setIsLoading(false);
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
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Daily Log</h1>
          <p className="text-sm text-muted-foreground">Log your biomarkers for AI analysis</p>
        </div>
      </div>

      {/* Sleep Hours */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Sleep Hours</p>
              <p className="text-xs text-muted-foreground">Last night</p>
            </div>
          </div>
          <span className="font-display text-2xl font-bold text-primary">{sleepHours}h</span>
        </div>
        <div className="mt-4">
          <Slider
            value={[sleepHours]}
            onValueChange={(v) => setSleepHours(v[0])}
            min={0}
            max={12}
            step={0.5}
            className="py-2"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0h</span>
            <span>12h</span>
          </div>
        </div>
      </div>

      {/* Stress Level */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">Stress Level</p>
              <p className="text-xs text-muted-foreground">How stressed do you feel?</p>
            </div>
          </div>
          <span className="font-display text-2xl font-bold text-amber-400">{stressLevel}/10</span>
        </div>
        <div className="mt-4">
          <Slider
            value={[stressLevel]}
            onValueChange={(v) => setStressLevel(v[0])}
            min={1}
            max={10}
            step={1}
            className="py-2"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Calm</span>
            <span>Very Stressed</span>
          </div>
        </div>
      </div>

      {/* Stress Cause */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <span className="text-lg">💭</span>
          </div>
          <div>
            <p className="font-medium text-foreground">{"What's causing your stress?"}</p>
            <p className="text-xs text-muted-foreground">Optional - helps personalize insights</p>
          </div>
        </div>
        <Textarea
          value={stressCause}
          onChange={(e) => setStressCause(e.target.value)}
          placeholder="e.g., exams, workload, relationships, health concerns, lack of sleep..."
          className="bg-secondary/50 border-border/50 resize-none"
          rows={3}
        />
      </div>

      {/* Mood */}
      <div>
        <h3 className="mb-3 font-display font-semibold text-foreground">{"How's your mood?"}</h3>
        <div className="grid grid-cols-5 gap-2">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.mood}
              onClick={() => setSelectedMood(option.mood)}
              className={cn(
                "glass-card flex flex-col items-center gap-2 p-3 transition-all",
                selectedMood === option.mood 
                  ? "border-primary/50 bg-primary/10" 
                  : "hover:border-border/80"
              )}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className={cn(
                "text-xs",
                selectedMood === option.mood 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground"
              )}>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy Level */}
      <div>
        <h3 className="mb-3 font-display font-semibold text-foreground">Energy Level</h3>
        <div className="grid grid-cols-5 gap-2">
          {ENERGY_OPTIONS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedEnergy(level)}
              className={cn(
                "glass-card py-3 text-center text-sm transition-all",
                selectedEnergy === level 
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:border-border/80"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Inputs */}
      <div>
        <h3 className="mb-3 font-display font-semibold text-foreground">Quick Inputs</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setCaffeine(!caffeine)}
            className={cn(
              "glass-card flex flex-col items-center gap-2 p-4 transition-all",
              caffeine 
                ? "border-primary/50 bg-primary/10" 
                : "hover:border-border/80"
            )}
          >
            <Coffee className={cn("h-6 w-6", caffeine ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-sm", caffeine ? "text-foreground" : "text-muted-foreground")}>
              Caffeine
            </span>
          </button>
          <button
            onClick={() => setHealthyDiet(!healthyDiet)}
            className={cn(
              "glass-card flex flex-col items-center gap-2 p-4 transition-all",
              healthyDiet 
                ? "border-emerald-500/50 bg-emerald-500/10" 
                : "hover:border-border/80"
            )}
          >
            <Salad className={cn("h-6 w-6", healthyDiet ? "text-emerald-400" : "text-muted-foreground")} />
            <span className={cn("text-sm", healthyDiet ? "text-foreground" : "text-muted-foreground")}>
              Healthy Diet
            </span>
          </button>
          <button
            onClick={() => setExercise(!exercise)}
            className={cn(
              "glass-card flex flex-col items-center gap-2 p-4 transition-all",
              exercise 
                ? "border-emerald-500/50 bg-emerald-500/10" 
                : "hover:border-border/80"
            )}
          >
            <Dumbbell className={cn("h-6 w-6", exercise ? "text-emerald-400" : "text-muted-foreground")} />
            <span className={cn("text-sm", exercise ? "text-foreground" : "text-muted-foreground")}>
              Exercise
            </span>
          </button>
        </div>
      </div>

      {/* Menstrual Phase - Only for non-males */}
      <div>
        <h3 className="mb-3 font-display font-semibold text-foreground">
          Menstrual Phase
          {isMale && <span className="ml-2 text-xs text-muted-foreground">(Not applicable)</span>}
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {MENSTRUAL_PHASES.map((phase) => (
            <button
              key={phase}
              onClick={() => !isMale && setMenstrualPhase(phase)}
              disabled={isMale && phase !== 'NONE'}
              className={cn(
                "glass-card py-3 text-center text-xs transition-all",
                isMale && phase !== 'NONE' && "opacity-40 cursor-not-allowed",
                menstrualPhase === phase 
                  ? "border-primary/50 bg-primary/10 text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:border-border/80",
                isMale && phase === 'NONE' && "border-primary/50 bg-primary/10 text-foreground"
              )}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms */}
      <div>
        <h3 className="mb-3 font-display font-semibold text-foreground">Any Symptoms?</h3>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS_LIST.map((symptom) => (
            <button
              key={symptom.key}
              onClick={() => toggleSymptom(symptom.key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-all",
                symptoms[symptom.key]
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "bg-secondary text-muted-foreground border border-transparent hover:text-foreground"
              )}
            >
              {symptom.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Generating...
          </span>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Prediction
          </>
        )}
      </Button>
    </div>
  );
}
