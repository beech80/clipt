import type { CaptureOrientation, NativeBroadcastCapabilities, NativeBroadcastQuality, NativeBroadcastSelection, NativeEncoderSettings } from './types';

export const DEFAULT_NATIVE_QUALITY: NativeBroadcastQuality = '360p15';
export const NATIVE_QUALITY_IDS: readonly NativeBroadcastQuality[] = ['360p15', '480p30', '720p30', '1080p30'];
const dimensions: Record<NativeBroadcastQuality, readonly [number, number, number, number]> = {
  '360p15': [640, 360, 15, 1_000_000],
  '480p30': [854, 480, 30, 1_500_000],
  '720p30': [1280, 720, 30, 2_500_000],
  '1080p30': [1920, 1080, 30, 4_500_000],
};
export function nativeEncoderSettings(quality: NativeBroadcastQuality, orientation: CaptureOrientation): NativeEncoderSettings {
  if (!NATIVE_QUALITY_IDS.includes(quality) || !['portrait', 'landscape'].includes(orientation)) throw Error('Invalid broadcast quality');
  const [width, height, fps, videoBitrateBps] = dimensions[quality];
  return {
    width: orientation === 'portrait' ? height : width,
    height: orientation === 'portrait' ? width : height,
    fps, videoBitrateBps, audioBitrateBps: 64_000, audioSampleRateHz: 48_000,
    keyframeIntervalSeconds: 2, videoCodec: 'h264', audioCodec: 'aac',
  };
}
export function readNativeCapabilities(value: unknown, platform: string): NativeBroadcastCapabilities {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Native broadcaster unavailable');
  const v = value as Record<string, unknown>;
  if (v.protocolVersion !== 1 || !['ios', 'android'].includes(platform) || v.platform !== platform
    || !Array.isArray(v.modes) || !v.modes.length || v.modes.length > 2 || v.modes.some(m => !['camera', 'screen'].includes(m))
    || new Set(v.modes).size !== v.modes.length
    || !Array.isArray(v.qualityIds) || !v.qualityIds.length || v.qualityIds.length > 4
    || v.qualityIds.some(q => !NATIVE_QUALITY_IDS.includes(q)) || new Set(v.qualityIds).size !== v.qualityIds.length
    || typeof v.microphone !== 'boolean' || typeof v.cameraSwitch !== 'boolean' || typeof v.backgroundScreen !== 'boolean'
    || typeof v.systemAudio !== 'string' || !['supported', 'permission-dependent', 'unsupported'].includes(v.systemAudio)
    || (v.modes.includes('screen') && v.backgroundScreen !== true)) throw Error('Native broadcaster unavailable');
  return { protocolVersion: 1, platform: platform as 'ios' | 'android',
    modes: [...v.modes], qualityIds: [...v.qualityIds], microphone: v.microphone,
    cameraSwitch: v.cameraSwitch, backgroundScreen: v.backgroundScreen,
    systemAudio: v.systemAudio as NativeBroadcastCapabilities['systemAudio'] };
}
export function validateNativeSelection(selection: NativeBroadcastSelection, capabilities: NativeBroadcastCapabilities): NativeEncoderSettings {
  if (!selection || !capabilities.modes.includes(selection.mode) || !capabilities.qualityIds.includes(selection.quality)
    || typeof selection.microphone !== 'boolean' || typeof selection.systemAudio !== 'boolean'
    || !['front', 'back'].includes(selection.cameraPosition)
    || (selection.microphone && !capabilities.microphone)
    || (selection.systemAudio && (selection.mode !== 'screen' || capabilities.systemAudio === 'unsupported')))
    throw Error('Broadcast option is not supported on this device');
  return nativeEncoderSettings(selection.quality, selection.orientation);
}
