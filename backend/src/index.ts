import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/analyze', analyzeRoute);
app.use('/api/download', downloadRoute);

// Error Handling Middleware
app.use(errorHandler);

// Always listen (Render needs this)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
