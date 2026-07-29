# MediaFetch

A modern media downloader that supports YouTube, Instagram, Twitter/X, TikTok, Facebook, and more. Built with Next.js and Express.js.

## Features

- 🎥 Download videos from multiple platforms
- 📝 Extract captions, hashtags, and metadata
- 🖼️ View thumbnails before downloading
- ⚡ Fast streaming downloads via yt-dlp
- 📱 Progressive Web App (PWA) support
- 🎨 Beautiful, responsive UI with animations

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Express.js 5, TypeScript |
| Media Engine | yt-dlp, ffmpeg |
| UI | framer-motion, lucide-react |

## Project Structure

```
MediaFetch/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── middlewares/   # Error handling
│   │   ├── routes/        # API routes (analyze, download)
│   │   └── services/      # yt-dlp media extraction
│   └── package.json
├── frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/          # Pages and API routes
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities and services
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js >= 20
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env.local
npm run dev
```

Backend runs on [http://localhost:5000](http://localhost:5000)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Extract metadata from a media URL |
| GET | `/api/download` | Stream download a media file |
| GET | `/health` | Health check |

## Environment Variables

See `.env.example` files in both `backend/` and `frontend/` directories.

## Deployment

See the [Deployment Guide](./DEPLOYMENT.md) for production deployment instructions.

## License

ISC
