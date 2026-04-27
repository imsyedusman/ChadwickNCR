import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import ncrRoutes from './routes/ncr.routes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/user.routes';
import departmentRoutes from './routes/department.routes';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

dotenv.config();

// Validate critical environment variables
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`❌ CRITICAL ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Please ensure these are set in your deployment environment.');
  process.exit(1);
}

// Global error handlers for better logging
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/ncrs', ncrRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve client static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/debug-db', async (req, res) => {
  try {
    const { db }: any = await import('./db/index.js');
    const { users }: any = await import('./db/schema.js');
    const { count, eq }: any = await import('drizzle-orm');
    
    const userCount = await db.select({ value: count() }).from(users);
    const susman = await db.query.users.findFirst({
      where: eq(users.email, 'susman@chadwickswitchboards.com.au')
    });

    res.json({
      database: 'connected',
      userCount: userCount[0].value,
      susmanExists: !!susman,
      susmanEmail: susman?.email,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HAS_DATABASE_URL: !!process.env.DATABASE_URL,
        HAS_JWT_SECRET: !!process.env.JWT_SECRET
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.listen(port, () => {
  console.log(`🚀 Chadwick NCR Server running on port ${port}`);
});
