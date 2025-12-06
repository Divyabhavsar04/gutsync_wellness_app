import { DailyLog } from '@/types/wellness';

// Mood score calculation (0-100) based on daily log inputs
export function calculateMoodScore(log: DailyLog): number {
  let score = 50; // Base score

  // Mood category contribution (0-25 points)
  const moodMap = { 'Low': 0, 'Meh': 6, 'Okay': 12, 'Good': 18, 'Great': 25 };
  score += moodMap[log.mood_category] ?? 12;

  // Sleep contribution (0-20 points) - optimal is 7-9 hours
  const sleepScore = log.sleep_hours >= 7 && log.sleep_hours <= 9 
    ? 20 
    : Math.max(0, 20 - Math.abs(log.sleep_hours - 8) * 4);
  score += sleepScore;

  // Stress level impact (-15 to +15 points)
  const stressImpact = (5 - log.stress_level) * 3;
  score += stressImpact;

  // Lifestyle factors (0-15 points)
  if (log.healthy_diet) score += 5;
  if (log.exercise_done) score += 5;
  if (!log.caffeine_intake) score += 5;

  // Symptoms impact (-1 per symptom, max -10)
  const symptomCount = Object.values(log.symptoms).filter(Boolean).length;
  score -= Math.min(symptomCount * 2, 10);

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Energy forecast calculation (0-100) based on daily log inputs
export function calculateEnergyForecast(log: DailyLog, previousLogs: DailyLog[] = []): number {
  let score = 50;

  // Current energy level contribution (0-30 points)
  const energyMap = { 'Exhausted': 0, 'Low': 8, 'Moderate': 15, 'High': 23, 'Peak': 30 };
  score += energyMap[log.energy_level] ?? 15;

  // Sleep quality impact (0-20 points)
  const sleepScore = log.sleep_hours >= 7 && log.sleep_hours <= 9 
    ? 20 
    : Math.max(0, 20 - Math.abs(log.sleep_hours - 8) * 4);
  score += sleepScore;

  // Lifestyle factors (0-15 points)
  if (log.healthy_diet) score += 5;
  if (log.exercise_done) score += 5;
  if (!log.caffeine_intake) score += 5; // Less caffeine = more stable energy

  // Stress impact (-10 to +10)
  const stressImpact = (5 - log.stress_level) * 2;
  score += stressImpact;

  // Previous day momentum (+/-5 based on trend)
  if (previousLogs.length > 0) {
    const prevLog = previousLogs[0];
    const prevEnergy = energyMap[prevLog.energy_level] ?? 15;
    const currEnergy = energyMap[log.energy_level] ?? 15;
    if (currEnergy > prevEnergy) score += 5; // Upward trend
    else if (currEnergy < prevEnergy) score -= 5; // Downward trend
  }

  // Symptoms fatigue penalty
  if (log.symptoms.fatigue) score -= 10;
  if (log.symptoms.insomnia) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}
export interface HormoneStability {
  cortisol: number;
  serotonin: number;
  dopamine: number;
  melatonin: number;
  estrogen: number;
  testosterone: number;
}

// Hormone stability calculations based on dataset patterns
export function calculateHormoneStability(log: DailyLog, profile: { age: number; gender: string }): HormoneStability {
  const baseStability = 60;
  
  // Cortisol: inversely related to sleep, directly to stress
  let cortisol = baseStability;
  cortisol += (log.sleep_hours - 7) * 5; // Better sleep = lower cortisol impact
  cortisol -= (log.stress_level - 5) * 4; // Higher stress = lower stability
  if (log.exercise_done) cortisol += 10;
  cortisol = Math.max(20, Math.min(95, cortisol));

  // Serotonin: related to mood, diet, exercise
  let serotonin = baseStability;
  const moodBonus = { 'Low': -15, 'Meh': -5, 'Okay': 0, 'Good': 10, 'Great': 20 };
  serotonin += moodBonus[log.mood_category] ?? 0;
  if (log.healthy_diet) serotonin += 10;
  if (log.exercise_done) serotonin += 10;
  if (log.symptoms.anxiety) serotonin -= 10;
  serotonin = Math.max(20, Math.min(95, serotonin));

  // Dopamine: related to energy, mood, exercise
  let dopamine = baseStability;
  const energyBonus = { 'Exhausted': -20, 'Low': -10, 'Moderate': 0, 'High': 10, 'Peak': 20 };
  dopamine += energyBonus[log.energy_level] ?? 0;
  if (log.exercise_done) dopamine += 15;
  if (log.caffeine_intake) dopamine -= 5; // Caffeine can dysregulate dopamine
  dopamine = Math.max(20, Math.min(95, dopamine));

  // Melatonin: strongly related to sleep
  let melatonin = baseStability;
  melatonin += (log.sleep_hours - 7) * 8;
  if (log.symptoms.insomnia) melatonin -= 20;
  if (log.caffeine_intake) melatonin -= 10;
  melatonin = Math.max(20, Math.min(95, melatonin));

  // Estrogen: affected by menstrual phase, stress, age
  let estrogen = baseStability;
  if (profile.gender === 'Female') {
    const phaseModifier: Record<string, number> = {
      'NONE': 0,
      'Menstrual': -10,
      'Follicular': 10,
      'Ovulation': 15,
      'Luteal': 5,
    };
    estrogen += phaseModifier[log.menstrual_phase] ?? 0;
    if (log.symptoms.cramps) estrogen -= 10;
    if (log.symptoms.bloating) estrogen -= 5;
  }
  estrogen -= (log.stress_level - 5) * 2;
  estrogen = Math.max(20, Math.min(95, estrogen));

  // Testosterone: affected by sleep, exercise, stress
  let testosterone = baseStability;
  testosterone += (log.sleep_hours - 7) * 4;
  if (log.exercise_done) testosterone += 15;
  testosterone -= (log.stress_level - 5) * 3;
  if (profile.gender === 'Male') {
    testosterone += 5; // Slightly higher baseline for males
  }
  testosterone = Math.max(20, Math.min(95, testosterone));

  return {
    cortisol: Math.round(cortisol),
    serotonin: Math.round(serotonin),
    dopamine: Math.round(dopamine),
    melatonin: Math.round(melatonin),
    estrogen: Math.round(estrogen),
    testosterone: Math.round(testosterone),
  };
}

// Calculate overall wellness score
export function calculateWellnessScore(log: DailyLog, hormoneStability: HormoneStability): number {
  const moodScore = calculateMoodScore(log);
  const avgHormone = (hormoneStability.cortisol + hormoneStability.serotonin + hormoneStability.dopamine + hormoneStability.melatonin + hormoneStability.estrogen + hormoneStability.testosterone) / 6;
  
  // Weighted average: 40% mood, 30% hormone, 30% lifestyle
  let lifestyleScore = 50;
  if (log.healthy_diet) lifestyleScore += 15;
  if (log.exercise_done) lifestyleScore += 15;
  lifestyleScore += (log.sleep_hours >= 7 && log.sleep_hours <= 9 ? 20 : 10);
  
  const wellness = moodScore * 0.4 + avgHormone * 0.3 + lifestyleScore * 0.3;
  return Math.max(0, Math.min(100, Math.round(wellness)));
}

// Get wellness category
export function getWellnessCategory(score: number): 'Healthy' | 'Moderate' | 'Concern' | 'Severe' {
  if (score >= 75) return 'Healthy';
  if (score >= 55) return 'Moderate';
  if (score >= 35) return 'Concern';
  return 'Severe';
}
