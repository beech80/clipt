import type { QualityPreset } from '../types/broadcast';

export function readQualitySettings(value: unknown): Partial<QualityPreset> {
  if (!value || typeof value !== 'object') return {};
  const result: Partial<QualityPreset> = {};
  for (const key of ['fps', 'bitrate', 'keyframe_interval', 'audio_bitrate', 'audio_sample_rate'] as const) {
    const entry = (value as Record<string, unknown>)[key];
    if (typeof entry === 'number' && Number.isFinite(entry) && entry > 0) result[key] = entry;
  }
  if ('resolution' in value && typeof value.resolution === 'string') result.resolution = value.resolution;
  return result;
}
