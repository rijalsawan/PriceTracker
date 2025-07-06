import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import notificationRoutes from './routes/notifications';
import searchRoutes from './routes/search';

// Import middleware
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Import services
import { startPriceTracking } from './services/priceTracker';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Rate limiting - Updated for Railway
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks and development
  skip: (req) => {
    return req.path === '/api/health' || req.path === '/' || process.env.NODE_ENV === 'development';
  },
  // Use connection IP as fallback
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

// Middleware
app.use(helmet());

// CORS configuration for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://price-tracker-murex.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', authenticateToken, searchRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  
  // Test database connection and push schema if needed
  try {
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if tables exist by trying a simple query
    try {
      await prisma.user.findFirst();
      console.log('✅ Database tables exist');
    } catch (error) {
      console.log('⚠️ Database tables not found, they may need to be created');
      console.log('💡 Run "npx prisma db push" to create tables');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
  
  // Start price tracking service (with delay to allow DB setup)
  if (process.env.NODE_ENV !== 'test') {
    setTimeout(() => {
      startPriceTracking();
    }, 5000); // Wait 5 seconds before starting price tracking
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📴 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
