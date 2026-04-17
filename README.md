# BMI-Health-Tracker

A comprehensive BMI calculator with animated gauge, personalized health insights, history tracking with trend visualization, and a calming health-focused design

Built with [Builddy](https://builddy.app) — AI-powered app builder using GLM 5.1.

## Features

- BMI calculation with metric/imperial unit toggle
- Animated SVG gauge with color-coded zones and smooth needle transition
- Personalized health tips based on BMI category
- History tracker with localStorage and database persistence
- Trend line chart showing BMI progress over time
- Share results functionality
- Dark mode with calming health-focused color palette
- Smooth micro-animations on result reveal
- Responsive mobile-friendly design
- Encouraging and non-judgmental user experience

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Docker

```bash
docker compose up
```

### Deploy to Railway/Render

1. Push this directory to a GitHub repo
2. Connect to Railway or Render
3. It auto-detects the Dockerfile
4. Done!

## Tech Stack

- **Frontend**: HTML/CSS/JS + Tailwind CSS
- **Backend**: Express.js
- **Database**: SQLite
- **Deployment**: Docker