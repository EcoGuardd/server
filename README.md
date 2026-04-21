# EcoGuard Server

The backend infrastructure for EcoGuard, providing data services, AI integration, and environmental monitoring logic.

## 🚀 Key Responsibilities
- **AI Integration**: Orchestrates Gemini 1.5 Flash for reforestation planning and risk assessment.
- **Environmental Data**: Fetches and aggregates live data from NASA, Esri, and fire alert systems.
- **Data Persistence**: Manages environmental records and regional profiles via MongoDB.
- **Cron Jobs**: Automated synchronization of fire alerts and risk statuses.

## 🛠️ Technology Stack
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **AI**: Google Generative AI SDK
- **Validation**: Joi + Express-validator
- **Auth**: JWT + BcryptJS

## 🚦 API Endpoints
- `/api/dashboard`: Global and regional environmental metrics.
- `/api/reforestation`: AI-driven planner and suggestion engine.
- `/api/region`: Management of environmental regions and statuses.
- `/api/impact`: Analytics for reforestation progress.
- `/api/ai`: Direct access to environmental AI agents.

## ⚙️ Setup
1. `npm install`
2. Configure `.env` (see `.env.example`)
3. `npm run dev` to start the development server.
