import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import config from './config/env.js';

connectDB();

app.listen(config.PORT, () => console.log(`🚀 Server running on port ${config.PORT}`));