import { runDynamicPricingAgent } from '../agents/dynamicPricing.agent';

export async function runPricingUpdateJob(): Promise<void> {
  await runDynamicPricingAgent();
}
