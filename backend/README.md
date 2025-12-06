# GutSync Backend

FastAPI backend for GutSync wellness prediction application with ML models and Groq LLM integration.

## Features

- 🧠 ML-powered wellness predictions
- 💊 Hormone stability analysis
- 🤖 AI insights via Groq LLM
- 📊 Trend analysis
- 🔒 User profile management

## Quick Start

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate on macOS/Linux
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 4. Add ML Models

Create a `models` folder and add the 4 trained model files:

```
backend/
├── models/
│   ├── preprocessor.joblib
│   ├── stress_model.joblib
│   ├── hormones_model.joblib
│   └── wellness_model.joblib
```

**Note:** The API will work without models using mock predictions.

### 5. Run the Server

```bash
# Development
uvicorn main:app --reload --port 8000

# Or directly
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## API Endpoints

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check with model status |

### User Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/profile` | Create profile |
| GET | `/profile/{user_id}` | Get profile |
| PUT | `/profile/{user_id}` | Update profile |

### Daily Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/logs` | Create daily log |
| GET | `/logs/{user_id}` | Get user logs |

### Predictions & Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Generate wellness prediction |
| POST | `/insights` | Get AI-powered insights |
| GET | `/trends/{user_id}` | Get trend data |

## Example Usage

### Create a Prediction

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "log": {
      "date": "2024-01-15",
      "sleep_hours": 7.5,
      "stress_level": 4,
      "mood_category": "Good",
      "energy_level": "Moderate",
      "caffeine_intake": true,
      "healthy_diet": true,
      "exercise_done": true,
      "menstrual_phase": "NONE",
      "symptoms": {
        "fatigue": false,
        "bloating": false,
        "anxiety": false,
        "brain_fog": false,
        "insomnia": false,
        "cramps": false,
        "joint_pain": false
      }
    },
    "profile": {
      "age": 28,
      "gender": "Male",
      "goals": ["productivity", "fitness"]
    }
  }'
```

### Get AI Insights

```bash
curl -X POST "http://localhost:8000/insights" \
  -H "Content-Type: application/json" \
  -d '{
    "prediction": {
      "wellness_score": 75,
      "wellness_category": "Healthy",
      "stress_vs_sleep_score": 80,
      "hormone_stability": {
        "dopamine": 70,
        "cortisol": 65,
        "estrogen": 60,
        "testosterone": 75,
        "melatonin": 55,
        "serotonin": 72
      }
    },
    "logs": [],
    "profile": {
      "age": 28,
      "gender": "Male",
      "goals": ["productivity"]
    }
  }'
```

## Model Training

The models are trained using the `GutSync_model_training.ipynb` notebook. The training process:

1. Preprocesses input features (age, sleep, mood, symptoms, etc.)
2. Trains separate models for:
   - **Stress Model:** Predicts stress vs sleep score
   - **Hormones Model:** Predicts 6 hormone stability values
   - **Wellness Model:** Predicts overall wellness score

## Groq LLM Integration

The backend uses Groq's API (Mixtral 8x7B) for personalized recommendations.

### Configuration
Add your API key to `.env`:
```
GROQ_API_KEY=gsk_your_actual_api_key_here
```

### Fallback Behavior
If the API key is not configured or credits are exhausted:
- Falls back to rule-based recommendations
- 402 errors display "Insufficient credits" message

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for LLM | (required for AI) |
| `MODELS_DIR` | Path to models folder | `models` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `CORS_ORIGINS` | Allowed origins | `*` |

## Production Deployment

For production, consider:

1. **Database:** Replace in-memory storage with PostgreSQL
2. **CORS:** Set specific allowed origins
3. **Security:** Add authentication middleware
4. **Logging:** Configure proper logging
5. **Docker:** Use the provided Dockerfile

### Docker

```bash
docker build -t gutsync-backend .
docker run -p 8000:8000 --env-file .env gutsync-backend
```

## Troubleshooting

### Models not loading
- Ensure all 4 `.joblib` files are in the `models/` folder
- Check file permissions
- Verify scikit-learn version compatibility

### Groq API errors
- Verify API key is correct
- Check for rate limits or credit issues
- 402 error means insufficient credits

### Import errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`
