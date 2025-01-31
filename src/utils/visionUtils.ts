import { supabase } from '@/lib/supabase';

export interface VisionAnalysisResult {
  labelAnnotations?: Array<{
    description: string;
    score: number;
  }>;
  safeSearchAnnotation?: {
    adult: string;
    spoof: string;
    medical: string;
    violence: string;
    racy: string;
  };
  textAnnotations?: Array<{
    description: string;
    locale?: string;
  }>;
}

export async function analyzeImage(
  imageFile: File,
  features: string[] = ['LABEL_DETECTION', 'SAFE_SEARCH_DETECTION', 'TEXT_DETECTION']
): Promise<VisionAnalysisResult> {
  try {
    // Convert image to base64
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const { data, error } = await supabase.functions.invoke('vision-analysis', {
      body: {
        imageBase64: base64String,
        features,
      },
    });

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}