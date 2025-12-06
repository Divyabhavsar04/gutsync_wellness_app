"""
GutSync FastAPI Backend
Wellness prediction using ML models with Groq LLM for personalized insights
"""

import os
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import numpy as np

# Try to import ML libraries - they may not be available in all environments
try:
    import joblib
    import pandas as pd
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("⚠️ ML libraries (joblib, pandas) not installed. Using mock predictions.")

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="GutSync API",
    description="Wellness prediction and AI insights API",
    version="1.0.0"
)

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS[0] != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Model paths
MODELS_DIR = Path(os.getenv("MODELS_DIR", "models"))

# In-memory storage (replace with database in production)
profiles_db: Dict[str, Dict] = {}
logs_db: Dict[str, List[Dict]] = {}
predictions_db: Dict[str, List[Dict]] = {}


# ============ Pydantic Models ============

class Symptoms(BaseModel):
    fatigue: bool = False
    bloating: bool = False
    anxiety: bool = False
    brain_fog: bool = False
    insomnia: bool = False
    cramps: bool = False
    joint_pain: bool = False


class DailyLog(BaseModel):
    user_id: Optional[str] = None
    date: str
    sleep_hours: float
    stress_level: int
    stress_cause: Optional[str] = None
    mood_category: str  # Low, Meh, Okay, Good, Great
    energy_level: str  # Exhausted, Low, Moderate, High, Peak
    caffeine_intake: bool
    healthy_diet: bool
    exercise_done: bool
    menstrual_phase: str  # NONE, Menstrual, Follicular, Ovulation, Luteal
    symptoms: Symptoms


class UserProfile(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    age: int
    gender: str  # Male, Female, Non-binary, Prefer not to say
    goals: List[str] = []
    notifications: bool = True


class PredictionRequest(BaseModel):
    log: DailyLog
    profile: UserProfile


class HormoneStability(BaseModel):
    dopamine: float
    cortisol: float
    estrogen: float
    testosterone: float
    melatonin: float
    serotonin: float


class PredictionResult(BaseModel):
    wellness_score: float
    wellness_category: str
    stress_vs_sleep_score: float
    hormone_stability: HormoneStability
    recommendation: Optional[str] = None
    key_pattern: Optional[str] = None


class InsightsRequest(BaseModel):
    prediction: PredictionResult
    logs: List[DailyLog]
    profile: UserProfile


# ============ Model Loading ============

models = {}
model_info = {}


def validate_model(model, name: str) -> bool:
    """Validate that a loaded model has the expected methods"""
    if name == "preprocessor":
        # Preprocessor should have transform method
        if not hasattr(model, 'transform'):
            print(f"❌ {name} missing 'transform' method")
            return False
    else:
        # Other models should have predict method
        if not hasattr(model, 'predict'):
            print(f"❌ {name} missing 'predict' method")
            return False
    return True


def load_models():
    """Load ML models from disk"""
    global models, model_info
    
    if not ML_AVAILABLE:
        print("⚠️ ML libraries not available, using mock predictions")
        return
    
    if not MODELS_DIR.exists():
        print(f"⚠️ Models directory not found: {MODELS_DIR}")
        print("📁 Creating models directory...")
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        return
    
    model_files = {
        "preprocessor": "preprocessor.joblib",
        "stress_model": "stress_model.joblib",
        "hormones_model": "hormones_model.joblib",
        "wellness_model": "wellness_model.joblib",
    }
    
    print(f"\n📂 Loading models from: {MODELS_DIR.absolute()}")
    
    for name, filename in model_files.items():
        path = MODELS_DIR / filename
        if path.exists():
            try:
                model = joblib.load(path)
                if validate_model(model, name):
                    models[name] = model
                    
                    # Store model info for debugging
                    info = {"type": type(model).__name__}
                    if hasattr(model, 'feature_names_in_'):
                        info["features"] = list(model.feature_names_in_)
                    if hasattr(model, 'n_features_in_'):
                        info["n_features"] = model.n_features_in_
                    model_info[name] = info
                    
                    print(f"✅ Loaded {name}: {info['type']}")
            except Exception as e:
                print(f"❌ Failed to load {name}: {e}")
        else:
            print(f"⚠️ Model file not found: {path}")
    
    # Summary
    print(f"\n📊 Models loaded: {len(models)}/4")
    if len(models) < 4:
        print("\n📋 Missing models. Add these files to the 'models' folder:")
        for name, filename in model_files.items():
            if name not in models:
                print(f"   - {filename}")
        print("\n🔄 Using mock predictions until all models are available.\n")
    else:
        print("✅ All models loaded successfully!\n")
        
        # Print preprocessor features if available
        if "preprocessor" in model_info and "features" in model_info["preprocessor"]:
            print("📝 Expected input features:")
            for feat in model_info["preprocessor"]["features"]:
                print(f"   - {feat}")
            print()


@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    print("\n" + "="*50)
    print("🚀 Starting GutSync API...")
    print("="*50)
    load_models()
    print("="*50)
    print("✅ GutSync API ready!")
    print("="*50 + "\n")


# ============ Helper Functions ============

# Define the expected feature order based on typical training data
EXPECTED_FEATURES = [
    "Age",
    "Gender",
    "Sleep_hours",
    "Mood_category",
    "Energy_level",
    "Caffeine_intake",
    "Exercise_done",
    "Healthy_diet_followed",
    "Menstrual_phase",
    "Fatigue",
    "Bloating",
    "Anxiety",
    "Brain_fog",
    "Insomnia",
    "Cramps",
    "Joint_pain",
]


def prepare_input_data(log: DailyLog, profile: UserProfile) -> pd.DataFrame:
    """Prepare input data for ML models as a DataFrame"""
    
    # Map gender for model
    gender_map = {
        "Male": "Male",
        "Female": "Female",
        "Non-binary": "Female",
        "Prefer not to say": "Male"
    }
    
    # Ensure menstrual phase is NONE for males
    menstrual_phase = log.menstrual_phase
    if profile.gender == "Male" or profile.gender == "Prefer not to say":
        menstrual_phase = "NONE"
    
    # Create data dictionary matching expected features
    data = {
        "Age": profile.age,
        "Gender": gender_map.get(profile.gender, "Male"),
        "Sleep_hours": float(log.sleep_hours),
        "Mood_category": log.mood_category,
        "Energy_level": log.energy_level,
        "Caffeine_intake": "Yes" if log.caffeine_intake else "No",
        "Exercise_done": "Yes" if log.exercise_done else "No",
        "Healthy_diet_followed": "Yes" if log.healthy_diet else "No",
        "Menstrual_phase": menstrual_phase,
        "Fatigue": 1 if log.symptoms.fatigue else 0,
        "Bloating": 1 if log.symptoms.bloating else 0,
        "Anxiety": 1 if log.symptoms.anxiety else 0,
        "Brain_fog": 1 if log.symptoms.brain_fog else 0,
        "Insomnia": 1 if log.symptoms.insomnia else 0,
        "Cramps": 1 if log.symptoms.cramps else 0,
        "Joint_pain": 1 if log.symptoms.joint_pain else 0,
    }
    
    # Create DataFrame with correct column order
    # If preprocessor has feature_names_in_, use that order
    if "preprocessor" in models and hasattr(models["preprocessor"], 'feature_names_in_'):
        columns = list(models["preprocessor"].feature_names_in_)
        # Ensure all expected columns exist
        for col in columns:
            if col not in data:
                print(f"⚠️ Missing feature: {col}, using default value")
                data[col] = 0
        df = pd.DataFrame([{k: data[k] for k in columns}])
    else:
        # Use default expected features
        df = pd.DataFrame([data])
    
    return df


def get_wellness_category(score: float) -> str:
    """Get wellness category from score"""
    if score >= 75:
        return "Healthy"
    elif score >= 50:
        return "Moderate"
    elif score >= 25:
        return "Concern"
    return "Severe"


def calculate_hormone_stability(log: DailyLog, profile: UserProfile) -> HormoneStability:
    """Calculate hormone stability based on inputs (fallback when no ML model)"""
    base = 60
    
    # Cortisol: inversely related to sleep, directly to stress
    cortisol = base - (log.sleep_hours - 7) * 5 + (log.stress_level - 5) * 4
    cortisol = max(20, min(100, cortisol))
    
    # Serotonin: related to mood and exercise
    mood_map = {"Great": 20, "Good": 10, "Okay": 0, "Meh": -10, "Low": -20}
    serotonin = base + mood_map.get(log.mood_category, 0)
    if log.exercise_done:
        serotonin += 10
    serotonin = max(20, min(100, serotonin))
    
    # Dopamine: related to exercise and diet
    dopamine = base
    if log.exercise_done:
        dopamine += 15
    if log.healthy_diet:
        dopamine += 10
    dopamine = max(20, min(100, dopamine))
    
    # Melatonin: related to sleep
    melatonin = base + (log.sleep_hours - 7) * 8
    if log.symptoms.insomnia:
        melatonin -= 20
    melatonin = max(20, min(100, melatonin))
    
    # Estrogen/Testosterone: affected by menstrual phase and symptoms
    estrogen = base
    testosterone = base
    
    if profile.gender == "Female" or profile.gender == "Non-binary":
        phase_estrogen = {
            "Menstrual": -10, "Follicular": 15, "Ovulation": 25, "Luteal": 5, "NONE": 0
        }
        estrogen += phase_estrogen.get(log.menstrual_phase, 0)
        if log.symptoms.cramps:
            estrogen -= 10
    
    if log.exercise_done:
        testosterone += 10
    if log.stress_level > 6:
        testosterone -= 10
    
    return HormoneStability(
        dopamine=round(max(20, min(100, dopamine)), 1),
        cortisol=round(max(20, min(100, cortisol)), 1),
        estrogen=round(max(20, min(100, estrogen)), 1),
        testosterone=round(max(20, min(100, testosterone)), 1),
        melatonin=round(max(20, min(100, melatonin)), 1),
        serotonin=round(max(20, min(100, serotonin)), 1),
    )


def mock_prediction(log: DailyLog, profile: UserProfile) -> PredictionResult:
    """Generate mock prediction when models aren't available"""
    
    # Base wellness score
    base_score = 50
    
    # Adjust based on inputs
    if log.sleep_hours >= 7:
        base_score += 15
    elif log.sleep_hours >= 6:
        base_score += 5
    else:
        base_score -= 10
    
    if log.exercise_done:
        base_score += 10
    
    if log.healthy_diet:
        base_score += 10
    
    if log.stress_level <= 3:
        base_score += 10
    elif log.stress_level >= 7:
        base_score -= 15
    
    # Mood adjustment
    mood_adj = {"Great": 15, "Good": 10, "Okay": 0, "Meh": -5, "Low": -15}
    base_score += mood_adj.get(log.mood_category, 0)
    
    # Symptom penalties
    symptom_count = sum([
        log.symptoms.fatigue, log.symptoms.bloating, log.symptoms.anxiety,
        log.symptoms.brain_fog, log.symptoms.insomnia, log.symptoms.cramps,
        log.symptoms.joint_pain
    ])
    base_score -= symptom_count * 5
    
    # Clamp score
    wellness_score = max(0, min(100, base_score))
    
    # Calculate stress vs sleep score
    stress_sleep_score = max(0, 100 - (log.stress_level * 10) + (log.sleep_hours * 5))
    
    # Calculate hormone stability
    hormone_stability = calculate_hormone_stability(log, profile)
    
    return PredictionResult(
        wellness_score=round(wellness_score, 1),
        wellness_category=get_wellness_category(wellness_score),
        stress_vs_sleep_score=round(min(100, stress_sleep_score), 1),
        hormone_stability=hormone_stability
    )


def ml_prediction(log: DailyLog, profile: UserProfile) -> PredictionResult:
    """Generate prediction using ML models"""
    
    try:
        # Prepare input DataFrame
        df = prepare_input_data(log, profile)
        print(f"📊 Input DataFrame shape: {df.shape}")
        print(f"📊 Input columns: {list(df.columns)}")
        
        # Step 1: Preprocess the data
        preprocessor = models["preprocessor"]
        X_prep = preprocessor.transform(df)
        print(f"✅ Preprocessed shape: {X_prep.shape}")
        
        # Ensure X_prep is 2D numpy array
        if hasattr(X_prep, 'toarray'):
            X_prep = X_prep.toarray()
        X_prep = np.atleast_2d(X_prep)
        
        # Step 2: Predict stress score
        stress_model = models["stress_model"]
        stress_pred = stress_model.predict(X_prep)
        stress_score = float(stress_pred[0]) if hasattr(stress_pred, '__len__') else float(stress_pred)
        print(f"✅ Stress prediction: {stress_score}")
        
        # Step 3: Predict hormone stability
        hormones_model = models["hormones_model"]
        hormone_pred = hormones_model.predict(X_prep)
        
        # Handle different output formats
        if hasattr(hormone_pred, '__len__') and len(hormone_pred) > 0:
            if hasattr(hormone_pred[0], '__len__'):
                # 2D array: [[d, c, e, t, m, s]]
                h = hormone_pred[0]
            else:
                # 1D array or single prediction repeated
                h = hormone_pred
        else:
            h = [65, 70, 60, 65, 55, 68]  # fallback
            
        # Ensure we have 6 values for hormones
        if len(h) >= 6:
            hormone_stability = HormoneStability(
                dopamine=round(float(max(0, min(100, h[0]))), 1),
                cortisol=round(float(max(0, min(100, h[1]))), 1),
                estrogen=round(float(max(0, min(100, h[2]))), 1),
                testosterone=round(float(max(0, min(100, h[3]))), 1),
                melatonin=round(float(max(0, min(100, h[4]))), 1),
                serotonin=round(float(max(0, min(100, h[5]))), 1),
            )
        else:
            print(f"⚠️ Unexpected hormone prediction shape: {hormone_pred}")
            hormone_stability = calculate_hormone_stability(log, profile)
            
        print(f"✅ Hormone predictions: {hormone_stability}")
        
        # Step 4: Predict wellness score
        wellness_model = models["wellness_model"]
        
        # Stack features for wellness model: [preprocessed, stress, hormones]
        hormone_array = np.array([[
            hormone_stability.dopamine,
            hormone_stability.cortisol,
            hormone_stability.estrogen,
            hormone_stability.testosterone,
            hormone_stability.melatonin,
            hormone_stability.serotonin,
        ]])
        stress_array = np.array([[stress_score]])
        
        # Concatenate all features
        X_wellness = np.hstack([X_prep, stress_array, hormone_array])
        print(f"✅ Wellness input shape: {X_wellness.shape}")
        
        wellness_pred = wellness_model.predict(X_wellness)
        wellness_score = float(wellness_pred[0]) if hasattr(wellness_pred, '__len__') else float(wellness_pred)
        wellness_score = max(0, min(100, wellness_score))
        print(f"✅ Wellness prediction: {wellness_score}")
        
        # Calculate stress vs sleep score
        stress_sleep_score = max(0, min(100, 100 - stress_score))
        
        return PredictionResult(
            wellness_score=round(wellness_score, 1),
            wellness_category=get_wellness_category(wellness_score),
            stress_vs_sleep_score=round(stress_sleep_score, 1),
            hormone_stability=hormone_stability
        )
        
    except Exception as e:
        print(f"❌ ML prediction error: {e}")
        import traceback
        traceback.print_exc()
        raise


async def get_groq_insights(prediction: PredictionResult, logs: List[DailyLog], profile: UserProfile) -> Dict[str, str]:
    """Get personalized insights from Groq LLM"""
    
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        return {
            "recommendation": generate_default_recommendation(prediction),
            "key_pattern": generate_default_pattern(prediction)
        }
    
    context = f"""
    User Profile:
    - Age: {profile.age}
    - Gender: {profile.gender}
    - Goals: {', '.join(profile.goals) if profile.goals else 'Not specified'}
    
    Current Wellness Status:
    - Wellness Score: {prediction.wellness_score}/100
    - Category: {prediction.wellness_category}
    - Stress vs Sleep Score: {prediction.stress_vs_sleep_score}
    
    Hormone Stability:
    - Dopamine: {prediction.hormone_stability.dopamine}%
    - Cortisol: {prediction.hormone_stability.cortisol}%
    - Serotonin: {prediction.hormone_stability.serotonin}%
    - Melatonin: {prediction.hormone_stability.melatonin}%
    - Estrogen: {prediction.hormone_stability.estrogen}%
    - Testosterone: {prediction.hormone_stability.testosterone}%
    """
    
    prompt = f"""Based on this wellness data, provide:
    1. A personalized recommendation (2-3 sentences) for improving wellness
    2. A key pattern detected in the data (1-2 sentences)
    
    {context}
    
    Respond ONLY with valid JSON in this exact format:
    {{"recommendation": "your recommendation here", "key_pattern": "your pattern here"}}
    """
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mixtral-8x7b-32768",
                    "messages": [
                        {"role": "system", "content": "You are a wellness expert. Respond only with valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                },
                timeout=30.0
            )
            
            if response.status_code == 402:
                raise HTTPException(status_code=402, detail="Insufficient credits")
            
            if response.status_code != 200:
                print(f"Groq API error: {response.status_code} - {response.text}")
                raise Exception(f"Groq API error: {response.status_code}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # Parse JSON response
            try:
                # Clean up common issues
                content = content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                insights = json.loads(content)
                return insights
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                print(f"Raw content: {content}")
                return {
                    "recommendation": generate_default_recommendation(prediction),
                    "key_pattern": generate_default_pattern(prediction)
                }
                
    except httpx.TimeoutException:
        print("Groq API timeout")
        return {
            "recommendation": generate_default_recommendation(prediction),
            "key_pattern": generate_default_pattern(prediction)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Groq API error: {e}")
        if "credit" in str(e).lower() or "402" in str(e):
            raise HTTPException(status_code=402, detail="Insufficient credits")
        return {
            "recommendation": generate_default_recommendation(prediction),
            "key_pattern": generate_default_pattern(prediction)
        }


def generate_default_recommendation(prediction: PredictionResult) -> str:
    """Generate default recommendation without LLM"""
    if prediction.wellness_score >= 75:
        return "You're doing great! Keep maintaining your current healthy habits. Consider adding mindfulness or meditation to further optimize your wellbeing."
    elif prediction.wellness_score >= 50:
        return "You're doing well overall, but there's room for optimization. Focus on getting consistent sleep and consider adding more physical activity to your routine."
    elif prediction.wellness_score >= 25:
        return "Your wellness needs attention. Prioritize sleep quality, reduce stress where possible, and consider speaking with a healthcare provider about your symptoms."
    return "Your wellness score indicates significant concern. Please consult with a healthcare provider and focus on basic self-care: rest, hydration, and stress reduction."


def generate_default_pattern(prediction: PredictionResult) -> str:
    """Generate default pattern insight without LLM"""
    if prediction.stress_vs_sleep_score > 70:
        return "Your mood consistently improves 24-48 hours after getting 7+ hours of sleep. Prioritizing sleep on weeknights could boost your weekday productivity by ~20%."
    elif prediction.hormone_stability.cortisol > 70:
        return "High cortisol levels correlate with your stress patterns. Consider stress-reduction techniques like deep breathing or short walks."
    elif prediction.hormone_stability.serotonin < 50:
        return "Lower serotonin levels detected. Regular exercise and sunlight exposure can naturally boost serotonin production."
    return "Your energy levels peak when you combine good sleep with morning exercise. This pattern suggests optimizing your morning routine."


# ============ API Endpoints ============

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "GutSync API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ml_available": ML_AVAILABLE,
        "models_loaded": len(models),
        "models_required": 4,
        "models_ready": len(models) == 4,
        "loaded_models": list(models.keys()),
        "groq_configured": bool(GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here")
    }


@app.get("/models/info")
async def models_info():
    """Get information about loaded models"""
    return {
        "models_dir": str(MODELS_DIR.absolute()),
        "ml_available": ML_AVAILABLE,
        "models": model_info,
        "expected_features": EXPECTED_FEATURES
    }


@app.post("/profile", response_model=UserProfile)
async def create_profile(profile: UserProfile):
    """Create a new user profile"""
    profile_id = profile.id or str(datetime.now().timestamp())
    profile.id = profile_id
    profiles_db[profile_id] = profile.dict()
    return profile


@app.get("/profile/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    """Get user profile"""
    if user_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserProfile(**profiles_db[user_id])


@app.put("/profile/{user_id}", response_model=UserProfile)
async def update_profile(user_id: str, profile: UserProfile):
    """Update user profile"""
    if user_id not in profiles_db:
        profiles_db[user_id] = {}
    profiles_db[user_id].update(profile.dict(exclude_unset=True))
    profiles_db[user_id]["id"] = user_id
    return UserProfile(**profiles_db[user_id])


@app.post("/logs", response_model=DailyLog)
async def create_log(log: DailyLog):
    """Create a new daily log"""
    user_id = log.user_id or "default"
    if user_id not in logs_db:
        logs_db[user_id] = []
    logs_db[user_id].insert(0, log.dict())
    return log


@app.get("/logs/{user_id}")
async def get_logs(user_id: str, limit: int = 30):
    """Get user's daily logs"""
    if user_id not in logs_db:
        return []
    return logs_db[user_id][:limit]


@app.post("/predict", response_model=PredictionResult)
async def predict(request: PredictionRequest):
    """Generate wellness prediction from daily log"""
    log = request.log
    profile = request.profile
    
    # Check if all models are loaded
    required_models = ["preprocessor", "stress_model", "hormones_model", "wellness_model"]
    all_models_loaded = all(m in models for m in required_models)
    
    if all_models_loaded and ML_AVAILABLE:
        try:
            print("\n" + "="*40)
            print("🔮 Running ML Prediction")
            print("="*40)
            result = ml_prediction(log, profile)
            print("✅ ML prediction successful!")
            print("="*40 + "\n")
            return result
        except Exception as e:
            print(f"❌ ML prediction failed, falling back to mock: {e}")
            return mock_prediction(log, profile)
    else:
        if not ML_AVAILABLE:
            print("⚠️ ML libraries not available, using mock prediction")
        else:
            missing = [m for m in required_models if m not in models]
            print(f"⚠️ Missing models: {missing}, using mock prediction")
        return mock_prediction(log, profile)


@app.post("/insights")
async def get_insights(request: InsightsRequest):
    """Get AI-powered insights"""
    try:
        insights = await get_groq_insights(
            request.prediction,
            request.logs,
            request.profile
        )
        return insights
    except HTTPException:
        raise
    except Exception as e:
        print(f"Insights error: {e}")
        if "credit" in str(e).lower():
            raise HTTPException(status_code=402, detail="Insufficient credits")
        return {
            "recommendation": generate_default_recommendation(request.prediction),
            "key_pattern": generate_default_pattern(request.prediction)
        }


@app.get("/trends/{user_id}")
async def get_trends(user_id: str, days: int = 7):
    """Get trend data for user"""
    # Check if we have actual logs
    if user_id in logs_db and len(logs_db[user_id]) > 0:
        user_logs = logs_db[user_id][:days]
        trends = []
        for log in reversed(user_logs):
            try:
                log_date = datetime.strptime(log["date"], "%Y-%m-%d")
                date_str = log_date.strftime("%a")
            except:
                date_str = log.get("date", "Day")
                
            mood_map = {"Great": 100, "Good": 80, "Okay": 60, "Meh": 40, "Low": 20}
            trends.append({
                "date": date_str,
                "wellness_score": 70,
                "mood_score": mood_map.get(log.get("mood_category", "Okay"), 60),
                "stress_level": log.get("stress_level", 5) * 10,
                "sleep_hours": log.get("sleep_hours", 7)
            })
        return trends
    
    # Return mock trend data
    base_date = datetime.now()
    trends = []
    
    for i in range(days):
        date = base_date - timedelta(days=days - 1 - i)
        trends.append({
            "date": date.strftime("%a"),
            "wellness_score": int(np.random.randint(65, 90)),
            "mood_score": int(np.random.randint(60, 85)),
            "stress_level": int(np.random.randint(20, 45)),
            "sleep_hours": round(float(np.random.uniform(6, 9)), 1)
        })
    
    return trends


# ============ Debug Endpoints ============

@app.post("/debug/test-input")
async def debug_test_input(request: PredictionRequest):
    """Debug endpoint to see how input data is prepared"""
    if not ML_AVAILABLE:
        return {"error": "ML libraries not available"}
    
    df = prepare_input_data(request.log, request.profile)
    return {
        "columns": list(df.columns),
        "values": df.to_dict(orient="records")[0],
        "shape": list(df.shape)
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"\n🌐 Starting server at http://{host}:{port}")
    print(f"📚 API docs available at http://{host}:{port}/docs\n")
    
    uvicorn.run(app, host=host, port=port)
