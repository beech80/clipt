import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, history } = await req.json()

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API Key')
    }

    // Convert history to OpenAI format
    const messages = [
      {
        role: "system",
        content: `You are an expert AI gaming assistant with comprehensive knowledge of all video games, including:
        - Game mechanics and strategies
        - Gaming history and development
        - Esports and competitive gaming
        - Game lore and storylines
        - Technical aspects of games
        - Gaming platforms and hardware
        - Gaming industry trends
        - Speedrunning techniques
        - Game modifications and custom content
        - Gaming communities and culture

        Provide detailed, accurate responses while maintaining an engaging and friendly tone.
        If discussing strategies or techniques, be specific and explain the reasoning behind them.
        When referencing game lore or history, cite specific examples and interesting facts.
        Always aim to enhance the user's gaming knowledge and experience.`
      },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`)
    }

    const result = await response.json()
    const aiResponse = result.choices[0].message.content

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})