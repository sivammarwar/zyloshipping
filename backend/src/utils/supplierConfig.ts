/** True when AliExpress API key is present — without it we route only through CJ. */
export function isAliExpressConfigured(): boolean {
  return Boolean(process.env.ALIEXPRESS_APP_KEY?.trim());
}

let aliExpressWarned = false;

export function warnAliExpressDisabled(): void {
  if (aliExpressWarned || isAliExpressConfigured()) return;
  aliExpressWarned = true;
  console.warn(
    '[supplier] AliExpress credentials not configured, skipping AliExpress adapter — using CJ Dropshipping only'
  );
}
