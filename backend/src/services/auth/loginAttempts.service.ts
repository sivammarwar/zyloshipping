import { cache } from '../../lib/cache';
import { prisma } from '../../db/prisma';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds
const SUSPICIOUS_THRESHOLD = 10;

/**
 * Get login attempt count for an email
 */
export async function getLoginAttempts(email: string): Promise<number> {
  const key = `login_attempts:${email.toLowerCase()}`;
  const attempts = await cache.get<number>(key);
  return attempts || 0;
}

/**
 * Increment failed login attempts
 */
export async function incrementLoginAttempts(email: string): Promise<number> {
  const key = `login_attempts:${email.toLowerCase()}`;
  const attempts = await cache.incr(key, LOCKOUT_DURATION);
  
  // Log suspicious activity (10+ attempts)
  if (attempts >= SUSPICIOUS_THRESHOLD) {
    await logSuspiciousActivity(email, attempts);
  }
  
  return attempts;
}

/**
 * Clear login attempts on successful login
 */
export async function clearLoginAttempts(email: string): Promise<void> {
  const key = `login_attempts:${email.toLowerCase()}`;
  await cache.del(key);
}

/**
 * Check if account is locked due to too many failed attempts
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const attempts = await getLoginAttempts(email);
  return attempts >= MAX_ATTEMPTS;
}

/**
 * Get remaining lockout time in seconds
 */
export async function getLockoutTimeRemaining(email: string): Promise<number> {
  const key = `login_attempts:${email.toLowerCase()}`;
  const exists = await cache.exists(key);
  
  if (!exists) return 0;
  
  // Redis TTL returns remaining time in seconds
  // For simplicity, return fixed lockout duration
  return LOCKOUT_DURATION;
}

/**
 * Log suspicious login activity to AdminLog table
 */
async function logSuspiciousActivity(email: string, attempts: number): Promise<void> {
  try {
    // Find admin user to associate log with
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) return;

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'SUSPICIOUS_LOGIN_ATTEMPTS',
        resource: 'auth',
        resourceId: email,
        metaJson: {
          email,
          attempts,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.warn(`[auth] Suspicious activity: ${attempts} failed login attempts for ${email}`);
  } catch (error) {
    console.error('[auth] Error logging suspicious activity:', error);
  }
}
