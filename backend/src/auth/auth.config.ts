import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function createAuth(prisma: PrismaClient) {
  if (authInstance) return authInstance;

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET env var is required');

  authInstance = betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
    secret,
    trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:3000'],
    advanced: {
      useSecureCookies: true,
      defaultCookieAttributes: {
        sameSite: 'none' as const,
        secure: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    user: {
      additionalFields: {},
    },
  }) as ReturnType<typeof betterAuth>;

  return authInstance;
}

export function getAuth() {
  if (!authInstance) {
    throw new Error('Auth not initialized. Call createAuth() first.');
  }
  return authInstance;
}
