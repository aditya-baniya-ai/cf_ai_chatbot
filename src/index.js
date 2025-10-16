import { Ai } from '@cloudflare/ai';

// CORS Headers for allowing requests from the frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Expected POST', { status: 405 });
    }

    try {
      const { sessionId, message } = await request.json();

      if (!sessionId || !message) {
        return new Response('Missing sessionId or message', { status: 400 });
      }

      // --- MEMORY: Retrieve Chat History ---
      const historyKey = `chat_history_${sessionId}`;
      const savedHistory = await env.CHAT_HISTORY.get(historyKey, { type: 'json' });
      let messages = savedHistory || [];
      messages.push({ role: 'user', content: message });

      // --- LLM: Call Workers AI (Simplified non-streaming version) ---
      const ai = new Ai(env.AI);
      
      const systemPrompt = { 
        role: 'system', 
        content: 'You are a helpful and creative assistant who helps developers brainstorm project ideas that can be built on the Cloudflare stack. Be concise and provide actionable ideas.' 
      };

      const modelInputs = {
          messages: [systemPrompt, ...messages]
      };

      // The AI model now returns the full response object directly
      const aiResponse = await ai.run('@cf/meta/llama-3-8b-instruct', modelInputs);
      
      // Get the text content from the response
      const aiResponseContent = aiResponse.response || "Sorry, I couldn't generate a response.";

      // --- MEMORY: Save Updated Chat History ---
      messages.push({ role: 'assistant', content: aiResponseContent });
      await env.CHAT_HISTORY.put(historyKey, JSON.stringify(messages), { expirationTtl: 3600 });
      
      // Send the AI's response back to the frontend
      return new Response(JSON.stringify({ response: aiResponseContent }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });

    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  },
};

