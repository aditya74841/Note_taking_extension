import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import noteRouter from './routes/note.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy & running!' });
});

// Routes declaration
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/notes', noteRouter);

// Global Error Handler
app.use(errorHandler);

export { app };
