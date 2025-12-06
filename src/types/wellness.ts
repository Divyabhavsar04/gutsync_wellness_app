export interface UserProfile {
  id?: string;
  email?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
  goals: string[];
  notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DailyLog {
  id?: string;
  user_id?: string;
  date: string;
  sleep_hours: number;
  stress_level: number;
  stress_cause?: string;
  mood_category: 'Low' | 'Meh' | 'Okay' | 'Good' | 'Great';
  energy_level: 'Exhausted' | 'Low' | 'Moderate' | 'High' | 'Peak';
  caffeine_intake: boolean;
  healthy_diet: boolean;
  exercise_done: boolean;
  menstrual_phase: 'NONE' | 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';
  symptoms: {
    fatigue: boolean;
    bloating: boolean;
    anxiety: boolean;
    brain_fog: boolean;
    insomnia: boolean;
    cramps: boolean;
    joint_pain: boolean;
  };
  created_at?: string;
}

export interface PredictionResult {
  wellness_score: number;
  wellness_category: 'Healthy' | 'Moderate' | 'Concern' | 'Severe';
  stress_vs_sleep_score: number;
  hormone_stability: {
    dopamine: number;
    cortisol: number;
    estrogen: number;
    testosterone: number;
    melatonin: number;
    serotonin: number;
  };
  recommendation?: string;
  key_pattern?: string;
}

export interface TrendData {
  date: string;
  wellness_score: number;
  mood_score: number;
  stress_level: number;
  sleep_hours: number;
}

export type MoodEmoji = {
  mood: string;
  emoji: string;
  label: string;
};

export const MOOD_OPTIONS: MoodEmoji[] = [
  { mood: 'Low', emoji: '😔', label: 'Low' },
  { mood: 'Meh', emoji: '😐', label: 'Meh' },
  { mood: 'Okay', emoji: '🙂', label: 'Okay' },
  { mood: 'Good', emoji: '😊', label: 'Good' },
  { mood: 'Great', emoji: '😄', label: 'Great' },
];

export const ENERGY_OPTIONS = ['Exhausted', 'Low', 'Moderate', 'High', 'Peak'] as const;

export const MENSTRUAL_PHASES = ['NONE', 'Menstrual', 'Follicular', 'Ovulation', 'Luteal'] as const;

export const SYMPTOMS_LIST = [
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'bloating', label: 'Bloating' },
  { key: 'anxiety', label: 'Anxiety' },
  { key: 'brain_fog', label: 'Brain Fog' },
  { key: 'insomnia', label: 'Insomnia' },
  { key: 'cramps', label: 'Cramps' },
  { key: 'joint_pain', label: 'Joint Pain' },
] as const;

export const GOAL_OPTIONS = [
  { id: 'productivity', label: 'Productivity', emoji: '🎯' },
  { id: 'mood_balance', label: 'Mood Balance', emoji: '😌' },
  { id: 'fertility', label: 'Fertility', emoji: '💚' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
] as const;
