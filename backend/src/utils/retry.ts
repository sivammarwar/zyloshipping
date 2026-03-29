export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, err: unknown) => void;
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const base = opts.baseDelayMs ?? 500;
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      opts.onRetry?.(i + 1, e);
      if (i === attempts - 1) break;
      const delay = base * Math.pow(2, i);
      console.warn(`[retry] attempt ${i + 1}/${attempts} failed, waiting ${delay}ms`, String(e));
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}
