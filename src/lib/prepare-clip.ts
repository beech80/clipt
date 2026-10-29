import { ClipConversionRequired, validateClipFile } from './clip-upload';
import { convertClip, type ClipConversionOptions } from './convert-clip';

/** Conversion stays local. Only the validated, playable result reaches upload. */
export async function prepareClipFile(file: File, options: ClipConversionOptions = {}, convert = convertClip) {
  if (options.signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
  try { await validateClipFile(file); return file; }
  catch (error) { if (!(error instanceof ClipConversionRequired)) throw error; }
  options.onProgress?.(0);
  const prepared = await convert(file, options);
  if (options.signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
  await validateClipFile(prepared);
  return prepared;
}
