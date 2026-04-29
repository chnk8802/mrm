import 'dotenv/config';

import app from './app.js';

/*------Config------*/
import connectDB from './config/db.js';
import config from './config/env.js';

// ROUTES
/*------Auth Routes------*/
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

/*------Technciain Routes------*/
import technicianRoutes from './routes/technicianRoutes.js'

/*------Repair order------*/
import repairRoutes from './routes/repairRoutes.js';

/*------Customer------*/
import customerRoutes from './routes/customerRoutes.js';

/*------Spare Part Routes------*/
import sparePartRoutes from './routes/sparePartRoutes.js';

/*------Supplier Routes------*/
import supplierRoutes from './routes/supplierRoutes.js';

connectDB();


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/spare-parts', sparePartRoutes);
app.use('/api/suppliers', supplierRoutes);

app.get('/', (req, res) => res.send('Mobile Repair API Running...'));

app.listen(config.PORT, () => console.log(`🚀 Server running on port ${config.PORT}`));