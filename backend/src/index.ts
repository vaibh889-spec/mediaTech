import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import analyzeRoute from './routes/analyze';
import downloadRoute from './routes/download';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow configured origin, or all origins if not set
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Trust proxy when behind Railway/reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Request logging
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/analyze', analyzeRoute);
app.use('/api/download', downloadRoute);

// Error Handling Middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
