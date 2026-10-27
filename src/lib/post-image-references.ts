/** Legacy posts persist multiple absolute image URLs as a comma-separated list.
 * Commas inside provider transformation paths are part of a single URL.
 */
export function postImageReferences(value?: string | null): string[] {
  return (value ?? '').split(/,\s*(?=https?:\/\/)/i).map(item => item.trim()).filter(Boolean);
}
