export const MAX_CLIP_BYTES = 50 * 1024 * 1024;

export function formatClipSize(bytes: number) {
  if (bytes < 1024) return `${bytes} ${bytes === 1 ? "byte" : "bytes"}`;
  const unit = bytes < 1024 * 1024 ? "KB" : "MB";
  const divisor = unit === "KB" ? 1024 : 1024 * 1024;
  // Round upward so a file just over the limit never reads as exactly 50 MB.
  return `${Math.ceil(bytes / divisor * 10) / 10} ${unit}`;
}

export function clipUploadError(error: { statusCode?: string | number; message?: string }) {
  const status = Number(error.statusCode);
  const detail = error.message?.toLowerCase() ?? '';
  const retained = ' Your video and caption remain in this form; no new draft was saved.';
  if (status === 413 || /size|too large/.test(detail)) return 'This video exceeds the upload size limit of 50 MB.' + retained;
  if (status === 401) return 'Your sign-in expired. Sign in again before uploading.' + retained;
  if (status === 403 || /row.level|unauthorized|permission/.test(detail)) return 'Upload access was denied. Complete any required MFA and retry; otherwise the development storage permissions need checking.' + retained;
  if (/mime|content.type/.test(detail)) return 'This video format is not accepted. Export H.264 MP4 or WebM and retry.' + retained;
  if (status === 429) return 'Uploads are temporarily rate limited. Wait a moment and retry.' + retained;
  return 'The video upload failed. Check your connection and retry.' + retained;
}

export class ClipConversionRequired extends Error {
  constructor(format: 'HEVC' | 'MOV' = 'HEVC') { super(`This ${format} video needs a compatible MP4 copy before uploading.`); this.name = 'ClipConversionRequired'; }
}

export async function validateClipFile(file: File) {
  if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) throw new Error('Choose an MP4, MOV or WebM video.');
  if (!Number.isSafeInteger(file.size) || file.size <= 0) throw new Error('This video is empty or could not be read. Download it to your device first if it is stored in iCloud or another cloud drive, then choose it again.');
  if (file.size > MAX_CLIP_BYTES) throw new Error(`This video is ${formatClipSize(file.size)}. The upload limit is ${formatClipSize(MAX_CLIP_BYTES)}. Trim it or export a smaller copy, then choose it again.`);
  if (file.type === 'video/quicktime') throw new ClipConversionRequired('MOV');
  if (file.type === 'video/mp4') {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    // HEVC sample-entry identifiers can be in a trailing moov box. Scan the
    // bounded file, not only its header; never alter the original user's file.
    for (let i = 4; i + 4 <= bytes.length; i++) {
      if (bytes[i] !== 104 || bytes[i + 3] !== 49) continue;
      const hevc = (bytes[i + 1] === 118 && bytes[i + 2] === 99) || (bytes[i + 1] === 101 && bytes[i + 2] === 118);
      if (hevc && view.getUint32(i - 4) >= 8 && view.getUint32(i - 4) <= bytes.length - i + 4) {
        throw new ClipConversionRequired();
      }
    }
  }
}

export function clipCaption(caption: string, hashtags: string) {
  const clean = caption.trim();
  if (!clean || clean.length > 2000) throw new Error('Add a caption of 1–2,000 characters.');
  const words = hashtags.trim().split(/[\s,]+/).filter(Boolean);
  if (words.length > 10 || words.some(word => !/^#?[\p{L}\p{N}_]{1,40}$/u.test(word))) {
    throw new Error('Use up to 10 hashtags, with letters, numbers or underscores.');
  }
  const tags = [...new Set(words.map(word => '#' + word.replace(/^#/, '').toLowerCase()))];
  return clean + (tags.length ? '\n\n' + tags.join(' ') : '');
}
