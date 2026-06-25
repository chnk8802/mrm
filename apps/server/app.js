import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { handleError } from './utils/common/errorHandler.js'

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import technicianRoutes from './routes/technician.routes.js'
import customerRoutes from './routes/customer.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import repairRoutes from './routes/repair.routes.js';
import sparePartUsageRoutes from './routes/sparePartUsage.routes.js';
import paymentRoutes from './routes/payment.routes.js'
import reportRoutes from './routes/report.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: (origin, callback) => { callback(null, true) }, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res) => res.send('Mobile Repair API Running...'));

app.use('/api/platform/organizations', organizationRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/spare-part-usage', sparePartUsageRoutes)
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

app.use(handleError);

export default app;