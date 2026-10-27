import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticatedUser, errorResponse, requestMethod, serverEnv, jsonResponse } from '../_shared/request.ts';

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
  const method = requestMethod(req);
  if (method) return method;

  try {
    await authenticatedUser(req);
    const apiKey = serverEnv('GOOGLE_CLOUD_VISION_API_KEY');

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
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    return jsonResponse(data.responses[0]);

  } catch (error) {
    return errorResponse(error);
  }
});
