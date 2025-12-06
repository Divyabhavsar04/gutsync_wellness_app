import { DailyLog, PredictionResult, UserProfile, TrendData } from '@/types/wellness';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
    
    // Handle specific Groq credit errors
    if (response.status === 402 || 
        (errorData.detail && errorData.detail.toLowerCase().includes('credit')) ||
        (errorData.detail && errorData.detail.toLowerCase().includes('insufficient'))) {
      throw new ApiError(402, 'Insufficient credits. Please check your API quota.');
    }
    
    throw new ApiError(response.status, errorData.detail || 'An error occurred');
  }
  return response.json();
}

export const api = {
  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  },

  // User Profile
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`);
    return handleResponse(response);
  },

  async createProfile(profile: UserProfile): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return handleResponse(response);
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return handleResponse(response);
  },

  // Daily Logs
  async getDailyLogs(userId: string, limit: number = 30): Promise<DailyLog[]> {
    const response = await fetch(`${API_BASE_URL}/logs/${userId}?limit=${limit}`);
    return handleResponse(response);
  },

  async createDailyLog(log: DailyLog): Promise<DailyLog> {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    return handleResponse(response);
  },

  // Predictions
  async getPrediction(log: DailyLog, profile: UserProfile): Promise<PredictionResult> {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log, profile }),
    });
    return handleResponse(response);
  },

  // AI Insights
  async getAIInsights(
    predictionResult: PredictionResult, 
    recentLogs: DailyLog[], 
    profile: UserProfile
  ): Promise<{ recommendation: string; key_pattern: string }> {
    const response = await fetch(`${API_BASE_URL}/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prediction: predictionResult, logs: recentLogs, profile }),
    });
    return handleResponse(response);
  },

  // Trends
  async getTrends(userId: string, days: number = 7): Promise<TrendData[]> {
    const response = await fetch(`${API_BASE_URL}/trends/${userId}?days=${days}`);
    return handleResponse(response);
  },
};

export { ApiError };
