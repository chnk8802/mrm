import 'dotenv/config';

const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  NODE_ENV: process.env.NODE_ENV,
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRE', 'NODE_ENV'];

required.forEach(key => {
  if (!env[key]) {
    throw new Error(`❌ ${key} is undefined. Please add it to your .env file.`);
  }
});

export default env;