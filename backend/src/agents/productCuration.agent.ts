import { invokeGpt4o } from './llm';

export async function runProductCurationAgent(input: { products: { id: string; rating: number; totalSales: number }[] }) {
  const { text } = await invokeGpt4o(
    'product_curation',
    'Given product stats, return JSON { keepIds: string[], rejectIds: string[] } for items that meet rating>=4 and sales>=50.',
    JSON.stringify(input)
  );
  try {
    return JSON.parse(text) as { keepIds: string[]; rejectIds: string[] };
  } catch {
    return { keepIds: input.products.filter(p => p.rating >= 4).map(p => p.id), rejectIds: [] };
  }
}
