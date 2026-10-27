const buckets = new Set(['media', 'posts', 'videos', 'avatars', 'clipt-avatars', 'recordings']);
const hasControl = (value: string) => Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

/** Identify our persisted storage references, never arbitrary signing targets.
 * This is parsing only, not authorization. Do not sign these references until
 * the database's object read-eligibility boundary is verified.
 */
export function privateMediaReference(value: string, projectUrl: string, allowLegacy = false): { bucket: string; path: string } | null {
  try {
    if (value.includes('\\') || hasControl(value)) return null;
    const project = new URL(projectUrl);
    const target = new URL(value);
    if (project.protocol !== 'https:' || project.username || project.password || target.origin !== project.origin || target.username || target.password) return null;
    const match = /^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/.exec(target.pathname);
    if (!match || !buckets.has(match[1])) return null;
    const segments = match[2].split('/').map(segment => decodeURIComponent(segment));
    if (segments.length < (allowLegacy ? 1 : 2) || segments.some(segment => !segment || segment === '.' || segment === '..' || hasControl(segment) || /[\\/%]/.test(segment))) return null;
    if (!allowLegacy && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[0])) return null;
    // URL normalizes literal dot segments. Reject them before parsing as well.
    if (/(?:\/|%2f)(?:\.|%2e){1,2}(?:\/|%2f|[?#]|$)/i.test(value)) return null;
    return { bucket: match[1], path: segments.join('/') };
  } catch { return null; }
}
