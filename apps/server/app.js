import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { handleError } from './utils/errorHandler.js'

// ROUTES
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import technicianRoutes from './routes/technician.routes.js'
import repairRoutes from './routes/repair.routes.js';
import customerRoutes from './routes/customer.routes.js';
import sparePartRoutes from './routes/sparePart.routes.js'


import supplierRoutes from './routes/supplier.routes.js';
import sparePartUsageRoutes from './routes/sparePartUsage.routes.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: (origin, callback) => { callback(null, true) }, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/spare-part-usage', sparePartUsageRoutes)

app.use('/api/suppliers', supplierRoutes);
app.use('/api/spare-parts', sparePartRoutes);

app.get('/', (req, res) => res.send('Mobile Repair API Running...'));

app.use(handleError);

export default app;