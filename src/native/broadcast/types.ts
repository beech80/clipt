export type NativeBroadcastMode = 'camera' | 'screen';
export type NativeBroadcastPlatform = 'ios' | 'android';
export type NativeBroadcastQuality = '360p15' | '480p30' | '720p30' | '1080p30';
export type CaptureOrientation = 'portrait' | 'landscape';
export type NativePublishState = 'idle' | 'requesting-permission' | 'connecting' | 'publishing' | 'reconnecting' | 'stopping' | 'ended' | 'failed';

export interface NativeBroadcastCapabilities {
  protocolVersion: 1;
  platform: NativeBroadcastPlatform;
  modes: NativeBroadcastMode[];
  qualityIds: NativeBroadcastQuality[];
  microphone: boolean;
  cameraSwitch: boolean;
  backgroundScreen: boolean;
  systemAudio: 'supported' | 'permission-dependent' | 'unsupported';
}
export interface NativeBroadcastSelection {
  mode: NativeBroadcastMode;
  quality: NativeBroadcastQuality;
  orientation: CaptureOrientation;
  microphone: boolean;
  systemAudio: boolean;
  cameraPosition: 'front' | 'back';
}
export interface NativeEncoderSettings {
  width: number;
  height: number;
  fps: number;
  videoBitrateBps: number;
  audioBitrateBps: number;
  audioSampleRateHz: number;
  keyframeIntervalSeconds: number;
  videoCodec: 'h264';
  audioCodec: 'aac';
}
export interface NativeBroadcastStart {
  selection: NativeBroadcastSelection;
  // One-use, expiring, owner/mode/quality-bound grant issued after backend Auth,
  // invitation and MFA checks. Native code redeems it over a fixed HTTPS origin;
  // the JS bridge accepts no provider keys, ingest URLs or arbitrary API origins.
  grant: string;
}
export interface CliptBroadcasterPlugin {
  getCapabilities(): Promise<unknown>;
  start(options: NativeBroadcastStart & { encoder: NativeEncoderSettings }): Promise<void>;
  stop(): Promise<void>;
  setMuted(options: { microphone: boolean; systemAudio: boolean }): Promise<void>;
  switchCamera(): Promise<void>;
  // Transport state is not authoritative LIVE state; keep using Mux-verified
  // backend discovery/chat/playback rather than writing streams.is_live here.
  getStatus(): Promise<{ state: NativePublishState }>;
}
