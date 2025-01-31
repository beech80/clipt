import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Twilio } from 'https://esm.sh/twilio@4.19.0'

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
    const { phoneNumber, message } = await req.json()

    // Initialize Twilio client
    const client = new Twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID')!,
      Deno.env.get('TWILIO_AUTH_TOKEN')!
    )

    // Send SMS
    const result = await client.messages.create({
      body: message,
      to: phoneNumber,
      from: '+12345678901', // Replace with your Twilio phone number
    })

    console.log('SMS sent successfully:', result.sid)

    return new Response(
      JSON.stringify({ success: true, messageId: result.sid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending SMS:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})