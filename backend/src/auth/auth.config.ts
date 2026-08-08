import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
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
    trustedOrigins: [
      ...(process.env.FRONTEND_URL ?? 'http://localhost:3000')
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),
      'https://*.vercel.app',
    ],
    advanced: {
      useSecureCookies: true,
      disableCSRFCheck: true,
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
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-up/email') {
          const inviteCode = ctx.headers?.get('x-invite-code');
          const expected = process.env.INVITE_CODE;
          if (expected && inviteCode !== expected) {
            throw new APIError('FORBIDDEN', { message: 'รหัสเชิญไม่ถูกต้อง' });
          }
        }
      }),
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
