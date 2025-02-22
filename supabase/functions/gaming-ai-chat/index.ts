
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      console.error('OpenAI API key is missing')
      throw new Error('OpenAI API key is not configured')
    }

    const { message, history } = await req.json()
    console.log('Received request with message:', message)
    console.log('Chat history:', history)

    // Validate input
    if (!message) {
      throw new Error('Message is required')
    }

    // Format messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are an expert AI gaming assistant with comprehensive knowledge of gaming and content creation. You help users with game strategies, industry trends, and growing their online presence through YouTube, streaming, and social media. Provide detailed, actionable advice while maintaining a friendly tone.`
      },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message }
    ]

    console.log('Sending request to OpenAI with messages:', messages)

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    const openAIData = await openAIResponse.json()
    console.log('OpenAI response:', openAIData)

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', openAIData)
      throw new Error(openAIData.error?.message || 'OpenAI API error')
    }

    if (!openAIData.choices?.[0]?.message?.content) {
      console.error('Invalid response format from OpenAI:', openAIData)
      throw new Error('Invalid response from OpenAI')
    }

    // Return successful response
    return new Response(
      JSON.stringify({ response: openAIData.choices[0].message.content }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in gaming-ai-chat function:', error)
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
