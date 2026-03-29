import { invokeGpt4o } from './llm';
import { sendAlertEmail } from '../services/email.service';
import { getAliExpressAdapter } from '../services/supplier/aliexpress.adapter';
import { getCjAdapter } from '../services/supplier/cj.adapter';

export async function runHealthMonitorAgent() {
  const checks: Record<string, boolean> = {};
  try {
    await getAliExpressAdapter().checkStock('health-check');
    checks.aliexpress = true;
  } catch {
    checks.aliexpress = false;
  }
  try {
    await getCjAdapter().checkStock('health-check');
    checks.cj = true;
  } catch {
    checks.cj = false;
  }

  const { text } = await invokeGpt4o(
    'health_monitor',
    'Summarise service health in one sentence.',
    JSON.stringify(checks)
  );

  if (!checks.aliexpress || !checks.cj) {
    await sendAlertEmail('ZyloShipping supplier alert', JSON.stringify(checks));
  }

  return { checks, summary: text };
}
