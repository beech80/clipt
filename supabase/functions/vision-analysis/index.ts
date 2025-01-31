import { serve } from 'https://deno.fresh.run/std@v9.6.1/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface AnnotateImageRequest {
  image: {
    content: string;
  };
  features: {
    type: string;
    maxResults?: number;
  }[];
}

interface VisionAnalysisRequest {
  imageBase64: string;
  features?: string[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Google Cloud Vision API Key');
    }

    const { imageBase64, features = ['LABEL_DETECTION', 'SAFE_SEARCH_DETECTION', 'TEXT_DETECTION'] } = await req.json() as VisionAnalysisRequest;

    // Prepare the request to Google Cloud Vision API
    const requestBody: AnnotateImageRequest = {
      image: {
        content: imageBase64,
      },
      features: features.map(feature => ({
        type: feature,
        maxResults: 10,
      })),
    };

    // Call Google Cloud Vision API
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [requestBody],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Vision API error:', error);
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data.responses[0]),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});