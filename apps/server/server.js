import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import config from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import userRoutes from './routes/userRoutes.js';

connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        // In production, you would want to restrict this
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => res.send('Mobile Repair API Running...'));

app.listen(config.PORT, () => console.log(`🚀 Server running on port ${config.PORT}`));