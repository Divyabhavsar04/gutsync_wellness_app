import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dailyLog, hormoneData, moodScore, energyForecast, wellnessScore, profile } = await req.json();
    
    // Use Groq API for AI insights (same as backend)
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const systemPrompt = `You are a wellness AI assistant for GutSync, a hormone and gut health tracking app. 
Your role is to analyze user health data and provide personalized, actionable recommendations.

Guidelines:
- Be warm, supportive, and encouraging
- Focus on evidence-based wellness advice
- Provide specific, actionable recommendations (not generic advice)
- Consider hormone patterns, sleep, stress, and lifestyle factors
- Identify meaningful patterns in the data
- Keep responses concise but helpful

Format your response as JSON with two fields:
1. "recommendation": A personalized recommendation (2-3 sentences max)
2. "key_pattern": A specific pattern you've detected in their data (1-2 sentences)`;

    const userPrompt = `Analyze this wellness data and provide personalized insights:

**User Profile:**
- Age: ${profile.age}
- Gender: ${profile.gender}
- Goals: ${profile.goals?.join(', ') || 'General wellness'}

**Today's Log:**
- Sleep: ${dailyLog.sleep_hours} hours
- Stress Level: ${dailyLog.stress_level}/10
- Mood: ${dailyLog.mood_category}
- Energy: ${dailyLog.energy_level}
- Caffeine: ${dailyLog.caffeine_intake ? 'Yes' : 'No'}
- Healthy Diet: ${dailyLog.healthy_diet ? 'Yes' : 'No'}
- Exercise: ${dailyLog.exercise_done ? 'Yes' : 'No'}
- Menstrual Phase: ${dailyLog.menstrual_phase}
- Symptoms: ${Object.entries(dailyLog.symptoms || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}

**Calculated Metrics:**
- Wellness Score: ${wellnessScore}/100
- Mood Score: ${moodScore}/100
- Energy Forecast: ${energyForecast}/100

**Hormone Stability:**
- Cortisol: ${hormoneData.cortisol}%
- Serotonin: ${hormoneData.serotonin}%
- Dopamine: ${hormoneData.dopamine}%
- Melatonin: ${hormoneData.melatonin}%
- Estrogen: ${hormoneData.estrogen}%
- Testosterone: ${hormoneData.testosterone}%

Provide a personalized recommendation and identify a key pattern.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please check your API quota.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('AI gateway error:', status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If JSON parsing fails, extract from text
      parsed = {
        recommendation: content?.slice(0, 200) || 'Focus on maintaining a consistent sleep schedule and managing stress through daily exercise.',
        key_pattern: 'Your wellness patterns show room for optimization.',
      };
    }

    return new Response(
      JSON.stringify({
        recommendation: parsed.recommendation || 'Keep tracking your daily wellness metrics for more personalized insights.',
        key_pattern: parsed.key_pattern || 'Continue logging to identify patterns.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.toLowerCase().includes('credit') || errorMessage.toLowerCase().includes('insufficient')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
