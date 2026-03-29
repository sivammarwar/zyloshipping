import { invokeGpt4o } from './llm';

interface CustomerSupportContext {
  userName: string;
  userEmail: string;
  recentOrders: Array<{
    orderNumber: string;
    status: string;
    amount: number;
    date: Date;
  }>;
  policies: {
    returns: string;
    freeShipping: string;
    deliveryTime: string;
  };
  message: string;
  orderId?: string;
}

interface CustomerSupportResponse {
  reply: string;
  requiresHuman: boolean;
}

export async function runCustomerSupportAgent(context: CustomerSupportContext): Promise<CustomerSupportResponse> {
  // Build comprehensive context for AI
  const contextString = `
Customer: ${context.userName} (${context.userEmail})

Recent Orders:
${context.recentOrders.map(o => `- Order ${o.orderNumber}: ${o.status} - ₹${o.amount.toLocaleString('en-IN')}`).join('\n')}

Store Policies:
- ${context.policies.returns}
- ${context.policies.freeShipping}
- ${context.policies.deliveryTime}

Customer Message: ${context.message}
  `.trim();

  const systemPrompt = `You are a helpful customer support agent for ZyloShipping, an e-commerce platform.

Your role:
- Answer customer questions about orders, shipping, returns, and policies
- Be friendly, professional, and concise (max 120 words)
- Use the customer's name when appropriate
- Reference specific order numbers when discussing orders
- If you cannot help or the issue requires human intervention, say so clearly

When to escalate to human:
- Refund requests over ₹2000
- Complex disputes or complaints
- Technical issues you cannot resolve
- Requests for account deletion or sensitive data
- Anything requiring manual verification

Format your response as JSON:
{
  "reply": "your helpful response here",
  "requiresHuman": true/false
}`;

  try {
    const { text } = await invokeGpt4o(
      'customer_support',
      systemPrompt,
      contextString
    );

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return {
        reply: parsed.reply || text,
        requiresHuman: parsed.requiresHuman || false,
      };
    } catch {
      // If not JSON, treat as plain text response
      const requiresHuman = text.toLowerCase().includes('human') || 
                           text.toLowerCase().includes('escalate') ||
                           text.toLowerCase().includes('cannot help');
      
      return {
        reply: text,
        requiresHuman,
      };
    }
  } catch (error) {
    console.error('[Customer Support Agent] Error:', error);
    return {
      reply: 'I apologize, but I\'m having trouble right now. A human agent will assist you shortly.',
      requiresHuman: true,
    };
  }
}
