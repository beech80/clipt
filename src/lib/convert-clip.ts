import { MAX_CLIP_BYTES } from './clip-upload';

export type ClipConversionOptions = { signal?: AbortSignal; onProgress?: (progress: number) => void };
type MediaLibrary = typeof import('mediabunny');
const UNSUPPORTED = 'This browser cannot convert this iPhone video. Try the latest Safari on your iPhone, or export an H.264 MP4 copy.';

/** Loaded only for HEVC/MOV. Uses browser codecs; no video leaves the device. */
export async function convertClip(file: File, options: ClipConversionOptions = {}, load: () => Promise<MediaLibrary> = () => import('mediabunny')) {
  if (options.signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
  let media: MediaLibrary;
  try { media = await load(); }
  catch {
    if (options.signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
    throw new Error('Video conversion could not start. Check your connection and choose the video again.');
  }
  const input = new media.Input({ formats: [media.MP4, media.QTFF], source: new media.BlobSource(file) });
  let conversion: Awaited<ReturnType<typeof media.Conversion.init>> | undefined;
  let output: InstanceType<typeof media.Output> | undefined;
  let completed = false, timedOut = false;
  const abort = () => { void conversion?.cancel().catch(() => {}); input.dispose(); };
  const timeout = setTimeout(() => { timedOut = true; abort(); }, 180_000);
  options.signal?.addEventListener('abort', abort, { once: true });
  const check = () => {
    if (options.signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
    if (timedOut) throw new Error('Video conversion took too long. Try a shorter clip or export an H.264 MP4 copy.');
  };
  try {
    check();
    const [video, audio, duration] = await Promise.all([input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack(), input.computeDuration()]);
    check();
    if (!video || !Number.isFinite(duration) || duration <= 0) throw new Error('The video could not be read. Choose another copy.');
    if (duration > 300) throw new Error('On-device conversion supports videos up to 5 minutes. Trim this clip or export an H.264 MP4 copy.');
    if (!await video.canDecode()) throw new Error(UNSUPPORTED);
    check();
    const [width, height] = await Promise.all([video.getDisplayWidth(), video.getDisplayHeight()]);
    if (![width, height].every(value => Number.isFinite(value) && value >= 2)) throw new Error('The video dimensions could not be read.');
    const ratio = Math.min(1, 1280 / Math.max(width, height));
    const targetWidth = Math.max(2, Math.floor(width * ratio / 2) * 2);
    const targetHeight = Math.max(2, Math.floor(height * ratio / 2) * 2);
    const bitrate = Math.min(4_000_000, Math.max(400_000, Math.floor(MAX_CLIP_BYTES * .8 * 8 / duration) - 128_000));
    output = new media.Output({ format: new media.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new media.BufferTarget() });
    conversion = await media.Conversion.init({
      input, output, tracks: 'primary',
      video: { codec: 'avc', quality: new media.Quality({ bitrate }), width: targetWidth, height: targetHeight, fit: 'contain', frameRate: 30, allowTransformationMetadata: false, forceTranscode: true },
      // Copy compatible AAC; convert other audio only when its encoder exists.
      audio: { codec: 'aac', ...(audio?.codec !== 'aac' ? { quality: new media.Quality({ bitrate: 128_000 }) } : {}) },
      showWarnings: false,
    });
    check();
    if (!conversion.isValid || !conversion.utilizedTracks.includes(video) || (audio && !conversion.utilizedTracks.includes(audio))) throw new Error(UNSUPPORTED);
    conversion.onProgress = progress => options.onProgress?.(Math.max(0, Math.min(1, progress)));
    await conversion.execute();
    check();
    const data = (output.target as InstanceType<typeof media.BufferTarget>).buffer;
    if (!data?.byteLength) throw new Error('Video conversion produced no playable data. Choose another copy.');
    if (data.byteLength > MAX_CLIP_BYTES) throw new Error('The converted video exceeds 50 MB. Trim it and try again.');
    const result = new File([data], file.name.replace(/\.[^.]+$/, '') + '-compatible.mp4', { type: 'video/mp4', lastModified: file.lastModified });
    const inspection = new media.Input({ formats: [media.MP4], source: new media.BlobSource(result) });
    try {
      if ((await inspection.getPrimaryVideoTrack())?.codec !== 'avc' || (audio && !await inspection.getPrimaryAudioTrack())) throw new Error('The converted video or audio could not be verified.');
    } finally { inspection.dispose(); }
    check();
    completed = true;
    return result;
  } catch (error) {
    check();
    if (error instanceof Error && /browser cannot|could not|supports videos|exceeds 50 MB|took too long/.test(error.message)) throw error;
    throw new Error('This video could not be converted on this device. Try a shorter clip or export an H.264 MP4 copy.');
  } finally {
    clearTimeout(timeout); options.signal?.removeEventListener('abort', abort);
    if (!completed) { await conversion?.cancel().catch(() => {}); await output?.cancel().catch(() => {}); }
    input.dispose();
  }
}
