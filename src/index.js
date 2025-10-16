export default {
  async fetch(request, env) {
    // Handle CORS preflight requests to allow the frontend to connect.
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // Only allow POST requests for the chat logic.
    if (request.method !== 'POST') {
      return new Response('Expected POST', { status: 405 });
    }

    try {
      const { sessionId, message } = await request.json();

      if (!sessionId || !message) {
        return new Response('Missing sessionId or message in request body', { status: 400 });
      }

      // --- MEMORY: Retrieve Chat History from KV ---
      // Use the sessionId as the key to get the conversation history.
      const historyKey = `chat_history_${sessionId}`;
      const savedHistory = await env.CHAT_HISTORY.get(historyKey, { type: 'json' });
      let messages = savedHistory || [];

      // Add the new user message to the history.
      messages.push({ role: 'user', content: message });

      // --- LLM: Call Workers AI ---
      const ai = new Ai(env.AI);
      
      // We add a system prompt to guide the AI's behavior.
      const systemPrompt = { 
        role: 'system', 
        content: 'You are a helpful and creative assistant who helps developers brainstorm project ideas that can be built on the Cloudflare stack. Be concise and provide actionable ideas.' 
      };

      const modelInputs = {
          messages: [systemPrompt, ...messages]
      };

      const stream = await ai.run('@cf/meta/llama-3-8b-instruct', modelInputs);
      
      // The response from the model is a stream. We'll read it into a single string.
      const aiResponseContent = await readStream(stream);

      // --- MEMORY: Save Updated Chat History to KV ---
      // Add the AI's response to our history.
      messages.push({ role: 'assistant', content: aiResponseContent });
      
      // Save the updated conversation back to KV. TTL of 1 hour (3600 seconds).
      await env.CHAT_HISTORY.put(historyKey, JSON.stringify(messages), { expirationTtl: 3600 });
      
      // Send the AI's response back to the frontend.
      return new Response(JSON.stringify({ response: aiResponseContent }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders // Add CORS headers
        },
      });

    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders // Add CORS headers
        }
      });
    }
  },
};

// Helper to read a stream into a string.
async function readStream(stream) {
  const reader = stream.getReader();
  let result = '';
  while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += new TextDecoder().decode(value);
  }
  return result;
}

// CORS Headers for allowing requests from any origin (for development).
// For production, you might want to restrict this to your Pages domain.
const corsHeaders = {
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'POST, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type',
};

function handleOptions(request) {
if (
  request.headers.get('Origin') !== null &&
  request.headers.get('Access-Control-Request-Method') !== null &&
  request.headers.get('Access-Control-Request-Headers') !== null
) {
  // Handle CORS preflight requests.
  return new Response(null, {
    headers: corsHeaders,
  });
} else {
  // Handle standard OPTIONS request.
  return new Response(null, {
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}
}
