import { supabase } from "@/integrations/supabase/client";

export interface MuxUploadResponse {
  uploadId: string;
  url: string;
}

export interface MuxAsset {
  id: string;
  playback_ids: Array<{ id: string }>;
  status: string;
  duration: number;
  max_stored_resolution: string;
  max_stored_frame_rate: number;
  aspect_ratio: string;
}

export const createMuxUpload = async (): Promise<MuxUploadResponse> => {
  const { data, error } = await supabase.functions.invoke('mux-handler', {
    body: { action: 'createUpload' }
  });

  if (error) throw error;
  return data;
};

export const getMuxAsset = async (assetId: string): Promise<MuxAsset> => {
  const { data, error } = await supabase.functions.invoke('mux-handler', {
    body: { action: 'getAsset', assetId }
  });

  if (error) throw error;
  return data;
};

export const getMuxUpload = async (uploadId: string) => {
  const { data, error } = await supabase.functions.invoke('mux-handler', {
    body: { action: 'getUpload', uploadId }
  });

  if (error) throw error;
  return data;
};

export const deleteMuxAsset = async (assetId: string) => {
  const { error } = await supabase.functions.invoke('mux-handler', {
    body: { action: 'deleteAsset', assetId }
  });

  if (error) throw error;
};

// Asset ownership and provider metadata must be persisted by the authenticated
// upload handler/webhook, never by a browser-supplied asset ID or user ID.
