import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  db: {
    host: process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306', 10),
    user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'warung_mie_balap',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:5000'),

  uploadDir: path.resolve(process.env.UPLOAD_DIR || './src/uploads'),

  xendit: {
    secretKey: process.env.XENDIT_SECRET_KEY || '',
    callbackToken: process.env.XENDIT_CALLBACK_TOKEN || '',
  },
};
