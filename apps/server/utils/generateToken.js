import jwt from 'jsonwebtoken';
import config from '../config/env.js';

const generateToken = (id) => {
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

export default generateToken;
