import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { apiRouter } from './routes/api';

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }));

    app.use('/auth', authRouter);
    app.use('/api', apiRouter);

    return app;
}
