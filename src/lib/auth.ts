import 'server-only';
import { betterAuth } from 'better-auth';
import { getPool } from './db';

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret || authSecret.length < 32 || authSecret.startsWith('REPLACE_')) {
  throw new Error('Set a random BETTER_AUTH_SECRET in .env.local, with at least 32 characters.');
}

const baseURL = process.env.BETTER_AUTH_URL;
if (!baseURL) {
  throw new Error('Set BETTER_AUTH_URL in .env.local, for example http://localhost:3000.');
}

export const auth = betterAuth({
  database: getPool(),
  secret: authSecret,
  baseURL: baseURL,

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },

  // Our database already uses number IDs and English table names.
  advanced: {
    database: { generateId: 'serial' },
  },

  user: {
    modelName: 'users',
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    additionalFields: {
      role: {
        type: ['user', 'admin'],
        required: true,
        defaultValue: 'user',
        input: false,
      },
    },
  },

  session: {
    modelName: 'auth_sessions',
    expiresIn: 60 * 60 * 8,
    cookieCache: { enabled: false },
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
    },
  },

  account: {
    modelName: 'auth_accounts',
    fields: {
      userId: 'user_id',
      accountId: 'account_id',
      providerId: 'provider_id',
      password: 'password_hash',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  verification: {
    modelName: 'auth_verifications',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  // Limit repeated requests, including requests during local development.
  rateLimit: {
    enabled: true,
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
    },
  },
});
