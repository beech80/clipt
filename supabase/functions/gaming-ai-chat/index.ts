
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
      throw new Error('Missing OpenAI API Key')
    }

    const { message, history } = await req.json()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: `You are an expert AI gaming assistant with comprehensive knowledge of:

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

You also specialize in helping gamers grow their online presence with expertise in:

- YouTube gaming channel growth strategies
- Streaming best practices and setup
- Video editing and production techniques
- Thumbnail creation and SEO optimization
- Social media management for gamers
- Content planning and scheduling
- Building a personal gaming brand
- Networking in the gaming community
- Monetization strategies
- Analytics and channel growth metrics
- Audience engagement techniques
- Collaboration opportunities
- Equipment recommendations for content creation
- Time management for content creators
- Mental health and work-life balance for creators

Provide detailed, accurate responses while maintaining an engaging and friendly tone.
If discussing strategies or techniques, be specific and explain the reasoning behind them.
When referencing game lore or history, cite specific examples and interesting facts.
For content creation advice, provide actionable steps and real-world examples.
Always aim to enhance the user's gaming knowledge and content creation journey.`
          },
          ...history,
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    const data = await response.json()
    return new Response(
      JSON.stringify({ response: data.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
