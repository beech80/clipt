// Deliberately exclude URLs, response bodies, and raw provider/browser errors.
export function streamPlaybackError(type: unknown, status?: unknown): string {
  const code = typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599 ? ` HTTP ${status}.` : '';
  if (type === 'networkError') return `Playback network request failed.${code} The live playlist may not be ready, or the browser could not reach it. Retry while OBS is streaming.`;
  if (type === 'mediaError') return 'Playback media decoding failed. The browser could not decode this stream.';
  if (type === 'unsupported') return 'This browser does not support the required HLS playback format.';
  if (type === 'sourceError') return 'The browser could not load the media source. This does not prove HLS is unsupported. Retry while OBS is streaming.';
  return `Playback could not be initialized.${code} Retry while OBS is streaming.`;
}
