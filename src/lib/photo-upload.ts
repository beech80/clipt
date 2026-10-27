import { validateAvatarHeader } from './avatar-upload';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Validate, decode and re-encode before upload; never upload EXIF or active payloads. */
export async function preparePhoto(file: File): Promise<File> {
  validateAvatarHeader(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.type, file.size);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  // Inspect container chunks rather than trusting names/MIME or silently taking
  // only the first frame of an animated photo.
  if (file.type === 'image/png') {
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset);
      const chunk = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
      if (chunk === 'acTL') throw new Error('Animated photos are not supported. Choose a still JPEG, PNG or WebP.');
      if (length > bytes.length - offset - 12) break;
      offset += length + 12;
    }
  } else if (file.type === 'image/webp') {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const length = view.getUint32(offset + 4, true);
      const chunk = String.fromCharCode(...bytes.slice(offset, offset + 4));
      if (chunk === 'ANIM' || chunk === 'ANMF' || (chunk === 'VP8X' && (bytes[offset + 8] & 2))) {
        throw new Error('Animated photos are not supported. Choose a still JPEG, PNG or WebP.');
      }
      if (length > bytes.length - offset - 8) break;
      offset += 8 + length + (length % 2);
    }
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width > 8192 || bitmap.height > 8192) {
      throw new Error('Photo dimensions must be between 1 and 8192 pixels.');
    }
    const scale = Math.min(1, 4096 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo processing is unavailable in this browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      result => result ? resolve(result) : reject(new Error('Photo processing failed.')), 'image/jpeg', 0.9));
    if (!blob.size || blob.size > MAX_PHOTO_BYTES || blob.type !== 'image/jpeg') {
      throw new Error('The processed photo exceeds 5 MB or could not be encoded. Choose a smaller photo.');
    }
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  } finally { bitmap.close(); }
}

export function photoUploadError(error: { statusCode?: string | number }) {
  const status = Number(error.statusCode);
  const reason = status === 401 ? 'Your sign-in expired.' : status === 403
    ? 'Photo upload access was denied. Complete required MFA and retry.' : status === 413
      ? 'This photo exceeds the storage size limit.' : 'Photo upload failed. Check your connection and retry.';
  return reason + ' Your photo and caption remain in this form; no new draft was saved.';
}
