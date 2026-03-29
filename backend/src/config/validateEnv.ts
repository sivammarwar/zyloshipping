/**
 * Validates environment on process start. Fails fast on missing required vars.
 * Maps aliases (ALGOLIA_API_KEY → ALGOLIA_ADMIN_KEY, CJ_ACCESS_TOKEN → CJ_API_KEY).
 */

const REQUIRED_ALWAYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'OPENAI_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'ALGOLIA_APP_ID',
  'RESEND_API_KEY',
  'CJ_EMAIL',
] as const;

/** Accept CJ_API_KEY or CJ_ACCESS_TOKEN */
const CJ_TOKEN_KEYS = ['CJ_API_KEY', 'CJ_ACCESS_TOKEN'] as const;

/** Accept ALGOLIA_ADMIN_KEY or ALGOLIA_API_KEY */
const ALGOLIA_KEY_ALIASES = ['ALGOLIA_ADMIN_KEY', 'ALGOLIA_API_KEY'] as const;

const OPTIONAL_WARN = [
  'ALIEXPRESS_APP_KEY',
  'ALIEXPRESS_APP_SECRET',
  'AFTERSHIP_API_KEY',
] as const;

const WEBHOOK_SECRETS_PROD = ['STRIPE_WEBHOOK_SECRET', 'RAZORPAY_WEBHOOK_SECRET'] as const;

function missing(name: string): boolean {
  const v = process.env[name];
  return v === undefined || String(v).trim() === '';
}

function applyAliases(): void {
  if (missing('ALGOLIA_ADMIN_KEY') && !missing('ALGOLIA_API_KEY')) {
    process.env.ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_API_KEY;
  }
  if (missing('CJ_API_KEY') && !missing('CJ_ACCESS_TOKEN')) {
    process.env.CJ_API_KEY = process.env.CJ_ACCESS_TOKEN;
  }
  // Normalise Supabase service key name (user may use SERVICE_KEY in docs)
  if (!missing('SUPABASE_SERVICE_KEY') && missing('SUPABASE_SERVICE_ROLE_KEY')) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;
  }
  if (!missing('SUPABASE_SERVICE_ROLE_KEY') && missing('SUPABASE_SERVICE_KEY')) {
    process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
}

function hasCjToken(): boolean {
  return CJ_TOKEN_KEYS.some(k => !missing(k));
}

function hasAlgoliaKey(): boolean {
  return ALGOLIA_KEY_ALIASES.some(k => !missing(k));
}

/**
 * Call before createApp(). Exits process with code 1 if validation fails.
 */
export function validateEnv(): void {
  if (process.env.ZYLO_SKIP_ENV_VALIDATION === 'true') {
    console.warn('[env] ZYLO_SKIP_ENV_VALIDATION=true — skipping strict validation (development only)');
    applyAliases();
    return;
  }

  applyAliases();

  const errors: string[] = [];

  for (const key of REQUIRED_ALWAYS) {
    if (missing(key)) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  if (missing('SUPABASE_SERVICE_KEY') && missing('SUPABASE_SERVICE_ROLE_KEY')) {
    errors.push('Missing SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY for Supabase admin API)');
  }

  if (!hasCjToken()) {
    errors.push('Missing required CJ credential: set CJ_API_KEY or CJ_ACCESS_TOKEN');
  }

  if (!hasAlgoliaKey()) {
    errors.push('Missing required Algolia admin key: set ALGOLIA_ADMIN_KEY or ALGOLIA_API_KEY');
  }

  if (process.env.NODE_ENV === 'production') {
    for (const key of WEBHOOK_SECRETS_PROD) {
      if (missing(key)) {
        errors.push(
          `Missing ${key} — required in production for webhook signature verification (refusing to start)`
        );
      }
    }
  } else {
    for (const key of WEBHOOK_SECRETS_PROD) {
      if (missing(key)) {
        console.warn(
          `[env] ${key} not set — webhooks will skip signature verification in development only`
        );
      }
    }
  }

  for (const key of OPTIONAL_WARN) {
    if (missing(key)) {
      console.warn(`[env] Optional variable not set: ${key} (features using it will be degraded)`);
    }
  }

  if (errors.length > 0) {
    console.error('[env] Validation failed:\n', errors.join('\n'));
    process.exit(1);
  }

  console.log('[env] Required environment variables validated');
}
