import { Capacitor, registerPlugin } from '@capacitor/core';
import type { CliptBroadcasterPlugin, NativeBroadcastCapabilities, NativeBroadcastStart } from './types';
import { readNativeCapabilities, validateNativeSelection } from './policy';

type Runtime = { isNativePlatform(): boolean; getPlatform(): string; isPluginAvailable(name: string): boolean };
type Inspection = { supported: false; reason: 'native-app-required' | 'native-engine-missing' | 'native-engine-unavailable' }
  | { supported: true; capabilities: NativeBroadcastCapabilities };

// This is the native integration boundary, not an encoder implementation.
// Never fall back to browser screen capture, return invented capabilities or
// mark the stream LIVE because a native publisher connected.
export function createNativeBroadcastBridge(runtime: Runtime, plugin: CliptBroadcasterPlugin) {
  async function inspect(): Promise<Inspection> {
    if (!runtime.isNativePlatform()) return { supported: false, reason: 'native-app-required' };
    if (!runtime.isPluginAvailable('CliptBroadcaster')) return { supported: false, reason: 'native-engine-missing' };
    try { return { supported: true, capabilities: readNativeCapabilities(await plugin.getCapabilities(), runtime.getPlatform()) }; }
    catch { return { supported: false, reason: 'native-engine-unavailable' }; }
  }
  async function requireEngine() {
    const result = await inspect();
    if (!result.supported) throw Error('Native broadcasting is unavailable in this build');
    return result.capabilities;
  }
  return {
    inspect,
    async start(input: NativeBroadcastStart): Promise<void> {
      const capabilities = await requireEngine();
      if (!input || typeof input.grant !== 'string' || !/^[A-Za-z0-9_-]{64,2048}$/.test(input.grant)) throw Error('A valid broadcast grant is required');
      const encoder = validateNativeSelection(input.selection, capabilities);
      // Copy the allowlisted fields. An arbitrary caller cannot smuggle an ingest
      // host, stream key or unbounded bitrate into the native bridge options.
      const selection = input.selection;
      try { await plugin.start({ grant: input.grant, encoder, selection: {
        mode: selection.mode, quality: selection.quality, orientation: selection.orientation,
        microphone: selection.microphone, systemAudio: selection.systemAudio, cameraPosition: selection.cameraPosition,
      } }); } catch { throw Error('Native broadcast did not start'); }
    },
    async stop(): Promise<void> {
      // Ending capture must remain possible after permission/capability loss.
      if (!runtime.isNativePlatform() || !['ios', 'android'].includes(runtime.getPlatform())
        || !runtime.isPluginAvailable('CliptBroadcaster')) throw Error('Native broadcasting is unavailable in this build');
      try { await plugin.stop(); } catch { throw Error('Native broadcast could not be ended'); }
    },
    async setMuted(microphone: boolean, systemAudio: boolean): Promise<void> {
      const capabilities = await requireEngine();
      if (typeof microphone !== 'boolean' || typeof systemAudio !== 'boolean'
        || (!microphone && !capabilities.microphone)
        || (!systemAudio && capabilities.systemAudio === 'unsupported')) throw Error('Audio option is unavailable');
      try { await plugin.setMuted({ microphone, systemAudio }); } catch { throw Error('Audio could not be changed'); }
    },
    async switchCamera(): Promise<void> {
      const capabilities = await requireEngine();
      if (!capabilities.modes.includes('camera') || !capabilities.cameraSwitch) throw Error('Camera switching is unavailable');
      try { await plugin.switchCamera(); } catch { throw Error('Camera could not be changed'); }
    },
  };
}
export const nativeBroadcastBridge = createNativeBroadcastBridge(Capacitor, registerPlugin<CliptBroadcasterPlugin>('CliptBroadcaster'));
