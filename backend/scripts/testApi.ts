/**
 * Smoke-test public API routes. Run backend first: npm run dev
 * Usage: cd backend && npm run test:api
 * Optional: BASE_URL=http://localhost:4000 COOKIE=... for authenticated routes
 */
/* eslint-disable no-console */

type Result = { name: string; ok: boolean; detail?: string };

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';
const COOKIE = process.env.TEST_AUTH_COOKIE || '';

async function req(
  method: string,
  path: string,
  opts?: { body?: unknown; headers?: Record<string, string> }
): Promise<{ status: number; json: unknown }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(COOKIE ? { Cookie: COOKIE } : {}),
    ...opts?.headers,
  };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let json: unknown = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function pass(name: string, ok: boolean, detail?: string): Result {
  const r = { name, ok, detail };
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`);
  return r;
}

async function main() {
  const results: Result[] = [];

  {
    const { status, json } = await req('GET', '/health');
    const ok = status === 200 && (json as { status?: string })?.status === 'ok';
    results.push(pass('GET /health', ok, `status=${status}`));
  }

  {
    const { status, json } = await req('GET', '/api/products?page=1&limit=5');
    const body = json as { products?: unknown[] };
    const ok = status === 200 && Array.isArray(body?.products);
    results.push(pass('GET /api/products', ok, `status=${status}`));
  }

  {
    const email = `e2e_${Date.now()}@test.local`;
    const { status, json } = await req('POST', '/api/auth/register', {
      body: {
        email,
        password: 'TestPass123!',
        name: 'API Test User',
      },
    });
    const ok = status === 201 || status === 200;
    results.push(pass('POST /api/auth/register', ok, `status=${status}`));
  }

  {
    const { status } = await req('POST', '/api/auth/login', {
      body: { email: 'admin@zyloshipping.com', password: 'wrong' },
    });
    results.push(pass('POST /api/auth/login (expect 401)', status === 401, `status=${status}`));
  }

  {
    const { status, json } = await req('GET', '/api/support/tickets');
    results.push(
      pass(
        'GET /api/support/tickets (unauth expect 401)',
        status === 401,
        `status=${status}`
      )
    );
  }

  {
    const { status } = await req('POST', '/api/webhooks/stripe', {
      body: { type: 'ping' },
      headers: { 'Content-Type': 'application/json' },
    });
    results.push(
      pass(
        'POST /api/webhooks/stripe (dev may 400 without valid evt)',
        status === 400 || status === 503 || status === 200,
        `status=${status}`
      )
    );
  }

  {
    const { status } = await req('GET', '/api/products/stats');
    results.push(
      pass(
        'GET /api/products/stats (unauth expect 401/403)',
        status === 401 || status === 403,
        `status=${status}`
      )
    );
  }

  {
    const { status } = await req('GET', '/api/suppliers');
    results.push(pass('GET /api/suppliers', status === 200, `status=${status}`));
  }

  const failed = results.filter(r => !r.ok);
  console.log('\n--- summary ---');
  console.log(`Passed: ${results.filter(r => r.ok).length}/${results.length}`);
  if (failed.length) {
    console.log('Failed:', failed.map(f => f.name).join(', '));
    process.exitCode = 1;
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
