import OpenAI from 'openai';
import { logAiRun } from '../utils/aiLog';

const groq = process.env.GROQ_API_KEY 
  ? new OpenAI({ 
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    }) 
  : null;

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

export async function invokeGpt4o(agentName: string, system: string, user: string) {
  const start = Date.now();
  
  const client = groq || openai;
  const model = groq 
    ? 'llama-3.3-70b-versatile'
    : (process.env.OPENAI_MODEL || 'gpt-4o');
  
  if (!client) {
    await logAiRun({
      agentName,
      inputJson: { system, user },
      outputJson: { text: '[No AI API key configured]' },
      tokensUsed: 0,
      latencyMs: Date.now() - start,
    });
    return { text: 'AI is offline — configure GROQ_API_KEY or OPENAI_API_KEY.', tokens: 0 };
  }
  
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? '';
    const tokens = completion.usage?.total_tokens ?? 0;
    await logAiRun({
      agentName,
      inputJson: { system, user },
      outputJson: { text },
      tokensUsed: tokens,
      latencyMs: Date.now() - start,
    });
    return { text, tokens };
  } catch (error) {
    if (groq && openai) {
      console.warn(`[${agentName}] Groq failed, falling back to OpenAI:`, (error as Error).message);
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const text = completion.choices[0]?.message?.content ?? '';
      const tokens = completion.usage?.total_tokens ?? 0;
      await logAiRun({
        agentName,
        inputJson: { system, user },
        outputJson: { text },
        tokensUsed: tokens,
        latencyMs: Date.now() - start,
      });
      return { text, tokens };
    }
    throw error;
  }
}
