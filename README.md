# GutSync - Wellness Tracking & AI Insights

A comprehensive wellness tracking application that helps you monitor your health, track daily biomarkers, and get personalized AI-powered insights.

## Features

- 📊 **Daily Wellness Logging** - Track sleep, stress, mood, energy, and symptoms
- 🧠 **AI-Powered Insights** - Get personalized recommendations using ML models and AI
- 📈 **Trend Analysis** - Visualize your wellness trends over time
- 💊 **Hormone Stability Tracking** - Monitor 6 key hormones (cortisol, serotonin, dopamine, melatonin, estrogen, testosterone)
- 🔒 **Secure Authentication** - User profiles and data persistence with Supabase
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: FastAPI (Python), ML models (scikit-learn)
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq API (Mixtral 8x7B) for personalized insights
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd gutsync
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   # On Windows
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Create `.env` in the project root:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   ```
   
   Create `backend/.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key
   ```

5. **Run the application**
   
   Terminal 1 - Backend:
   ```bash
   cd backend
   python main.py
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Project Structure

```
gutsync/
├── src/                 # Frontend React application
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── store/          # State management
│   └── types/          # TypeScript types
├── backend/            # FastAPI backend
│   ├── main.py        # API server
│   └── models/        # ML model files
├── supabase/          # Supabase configuration
│   ├── migrations/    # Database migrations
│   └── functions/     # Edge functions
└── public/            # Static assets
```

## Development

### Frontend Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

### Backend Development
```bash
cd backend
python main.py      # Start with uvicorn
# Or
uvicorn main:app --reload --port 8000
```

## Deployment

### Frontend
The frontend can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Backend
The backend can be deployed to:
- Railway
- Render
- Heroku
- AWS EC2/ECS
- DigitalOcean

### Database
Supabase provides managed PostgreSQL with:
- Row-level security
- Real-time subscriptions
- Edge functions
- Authentication

## Environment Variables

See `.env.example` and `backend/.env.example` for required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
