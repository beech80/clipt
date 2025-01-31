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

export const trackMuxAsset = async (assetId: string, userId: string) => {
  const asset = await getMuxAsset(assetId);
  
  const { error } = await supabase
    .from('mux_assets')
    .insert({
      user_id: userId,
      asset_id: assetId,
      playback_id: asset.playback_ids[0]?.id,
      status: asset.status,
      duration: asset.duration,
      max_stored_resolution: asset.max_stored_resolution,
      max_stored_frame_rate: asset.max_stored_frame_rate,
      aspect_ratio: asset.aspect_ratio
    });

  if (error) throw error;
};