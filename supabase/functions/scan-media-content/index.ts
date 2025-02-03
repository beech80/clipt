import { serve } from "https://deno.fresh.run/std@v9.6.1/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const VISION_API_KEY = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mediaUrl, mediaType } = await req.json();

    // Call Google Cloud Vision API
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            source: {
              imageUri: mediaUrl
            }
          },
          features: [
            { type: 'SAFE_SEARCH_DETECTION' },
            { type: 'LABEL_DETECTION', maxResults: 10 }
          ]
        }]
      })
    });

    const data = await response.json();
    
    // Process the results
    const safeSearch = data.responses[0].safeSearchAnnotation;
    const labels = data.responses[0].labelAnnotations;

    // Determine if content is safe
    const isSafe = ['VERY_UNLIKELY', 'UNLIKELY'].includes(safeSearch.adult) &&
                  ['VERY_UNLIKELY', 'UNLIKELY'].includes(safeSearch.violence) &&
                  ['VERY_UNLIKELY', 'UNLIKELY'].includes(safeSearch.racy);

    const result = {
      safe_for_work: isSafe,
      contains_nudity: !['VERY_UNLIKELY', 'UNLIKELY'].includes(safeSearch.adult),
      contains_violence: !['VERY_UNLIKELY', 'UNLIKELY'].includes(safeSearch.violence),
      contains_hate: !['VERY_UNLIKELY', 'UNLIKELY'].includes(safeSearch.spoof),
      labels: labels.map(label => ({
        description: label.description,
        confidence: label.score
      })),
      raw_safe_search: safeSearch
    };

    // Log the scan results
    console.log('Content scan results:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error scanning content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});