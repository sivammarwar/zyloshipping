import { invokeGpt4o } from './llm';

export async function runContentGenerationAgent(input: { title: string; description: string }) {
  const { text } = await invokeGpt4o(
    'content_generation',
    'You rewrite supplier copy into SEO-optimised English for an ecommerce store. Return JSON with keys aiTitle, aiDescription, metaTags (string array).',
    JSON.stringify(input)
  );
  try {
    return JSON.parse(text) as { aiTitle: string; aiDescription: string; metaTags: string[] };
  } catch {
    return { aiTitle: input.title, aiDescription: input.description, metaTags: [] };
  }
}
