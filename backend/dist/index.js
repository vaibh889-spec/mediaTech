"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middlewares/errorHandler");
const analyze_1 = __importDefault(require("./routes/analyze"));
const download_1 = __importDefault(require("./routes/download"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Allow configured origin, or all origins if not set
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Trust proxy when behind Railway/reverse proxy
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
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
app.use('/api/analyze', analyze_1.default);
app.use('/api/download', download_1.default);
// Error Handling Middleware
app.use(errorHandler_1.errorHandler);
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
exports.default = app;
