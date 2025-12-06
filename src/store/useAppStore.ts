import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, DailyLog, PredictionResult, TrendData } from '@/types/wellness';

interface AppState {
  // User
  userId: string | null;
  profile: UserProfile | null;
  setUserId: (id: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;

  // Daily logs
  logs: DailyLog[];
  currentLog: DailyLog | null;
  setLogs: (logs: DailyLog[]) => void;
  addLog: (log: DailyLog) => void;
  setCurrentLog: (log: DailyLog | null) => void;

  // Predictions
  latestPrediction: PredictionResult | null;
  setLatestPrediction: (prediction: PredictionResult | null) => void;

  // Trends
  trends: TrendData[];
  setTrends: (trends: TrendData[]) => void;

  // AI Insights
  aiRecommendation: string | null;
  aiKeyPattern: string | null;
  setAIInsights: (recommendation: string, keyPattern: string) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  userId: null,
  profile: null,
  logs: [],
  currentLog: null,
  latestPrediction: null,
  trends: [],
  aiRecommendation: null,
  aiKeyPattern: null,
  isLoading: false,
  activeTab: 'home',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setUserId: (id) => set({ userId: id }),
      setProfile: (profile) => set({ profile }),

      setLogs: (logs) => set({ logs }),
      addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
      setCurrentLog: (log) => set({ currentLog: log }),

      setLatestPrediction: (prediction) => set({ latestPrediction: prediction }),

      setTrends: (trends) => set({ trends }),

      setAIInsights: (recommendation, keyPattern) => set({ 
        aiRecommendation: recommendation, 
        aiKeyPattern: keyPattern 
      }),

      setIsLoading: (loading) => set({ isLoading: loading }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      reset: () => set(initialState),
    }),
    {
      name: 'gutsync-storage',
      partialize: (state) => ({
        userId: state.userId,
        profile: state.profile,
        logs: state.logs,
        latestPrediction: state.latestPrediction,
        trends: state.trends,
        aiRecommendation: state.aiRecommendation,
        aiKeyPattern: state.aiKeyPattern,
      }),
    }
  )
);
