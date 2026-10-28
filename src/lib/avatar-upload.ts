export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function validateAvatarHeader(bytes: Uint8Array, mime: string, size: number): void {
  if (size <= 0 || size > AVATAR_MAX_BYTES) throw new Error('Choose an image smaller than 5 MB.');
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!((mime === 'image/png' && png) || (mime === 'image/jpeg' && jpeg) || (mime === 'image/webp' && webp))) {
    throw new Error('Choose a valid PNG, JPEG, or WebP image. SVG and animated files are not accepted.');
  }
}

// Decode and re-encode to discard embedded metadata and non-image payloads.
export async function prepareAvatar(file: File): Promise<Blob> {
  validateAvatarHeader(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.type, file.size);
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 8192 || bitmap.height > 8192 || !bitmap.width || !bitmap.height) {
      throw new Error('Image dimensions must be between 1 and 8192 pixels.');
    }
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const encoded = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Could not process this image.')), 'image/webp', 0.85));
    avatarUploadTarget(encoded);
    validateAvatarHeader(new Uint8Array(await encoded.slice(0, 12).arrayBuffer()), encoded.type, encoded.size);
    return encoded;
  } finally { bitmap.close(); }
}

export function avatarUploadTarget(avatar: Blob) {
  if (avatar.type === 'image/webp') return { bucket: 'clipt-avatars', extension: 'webp', contentType: 'image/webp' } as const;
  // Safari may return a re-encoded PNG when WebP encoding is unavailable.
  // This private bucket already accepts raster formats under the same owner/read boundaries.
  if (avatar.type === 'image/png') return { bucket: 'avatars', extension: 'png', contentType: 'image/png' } as const;
  if (avatar.type === 'image/jpeg') return { bucket: 'avatars', extension: 'jpg', contentType: 'image/jpeg' } as const;
  throw new Error('This browser could not create a supported profile image.');
}
