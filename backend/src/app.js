import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import stubRoutes from './routes/stubRoutes.js';
import postRoutes from './routes/postRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import exploreRoutes from './routes/exploreRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { sendError } from './utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const app = express();

const corsOptions = {
  origin: 'https://swish-frontend.onrender.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));


app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', postRoutes);
app.use('/api', userRoutes);
app.use('/api', eventRoutes);
app.use('/api', chatRoutes);
app.use('/api', notificationRoutes);
app.use('/api', shareRoutes);
app.use('/api', communityRoutes);
app.use('/api', exploreRoutes);
app.use('/api', searchRoutes);
app.use('/api', adminRoutes);
app.use('/api', stubRoutes); 

app.use((req, res) => sendError(res, { status: 404, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  return sendError(res, { status: err.status || 500, message: err.message || 'Internal server error' });
});

export default app;
