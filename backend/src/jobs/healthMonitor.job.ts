import { runHealthMonitorAgent } from '../agents/healthMonitor.agent';

export async function runHealthMonitorJob(): Promise<void> {
  await runHealthMonitorAgent();
}
