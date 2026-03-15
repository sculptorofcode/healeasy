import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import connectDB from './config/db';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import visitsRoutes from './routes/visits.routes';

const app = express();

app.use(express.json());
app.use(morgan('dev'));

// Middleware to ensure DB is connected before any request
app.use(async (req, _res, next) => {
  try {
    await connectDB();
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Versioned API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/visits', visitsRoutes);

app.use(errorHandler);

app.use('/', (_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
});

export default app;