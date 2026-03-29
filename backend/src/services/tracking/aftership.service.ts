import { retryWithBackoff } from '../../utils/retry';

const API = 'https://api.aftership.com/v4';

export async function registerTrackingWithAfterShip(
  trackingNumber: string,
  title: string
): Promise<{ id?: string } | null> {
  const key = process.env.AFTERSHIP_API_KEY;
  if (!key) {
    console.warn(
      '[aftership] AfterShip not configured, tracking registration skipped',
      trackingNumber
    );
    return null;
  }

  return retryWithBackoff(
    async () => {
      const res = await fetch(`${API}/trackings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aftership-api-key': key,
        },
        body: JSON.stringify({
          tracking_number: trackingNumber,
          title,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`AfterShip register ${res.status}: ${t}`);
      }
      const json = (await res.json()) as { data?: { id?: string } };
      return { id: json.data?.id };
    },
    { attempts: 3, baseDelayMs: 1000 }
  );
}
