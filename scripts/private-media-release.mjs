import { readFile } from 'node:fs/promises';

const development = 'akiksrlzdqvipqbbjxpw';
const production = 'slnjliheyiiummxhrgmk';
const mediaBuckets = new Set(['avatars','clipt-avatars','media','posts','videos','recordings']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Metadata-only inventory. No guessed ownership, destination writes or file moves.
 * Storage copy/move changes ownership to the initiating user. A bulk admin move
 * therefore cannot be assumed to preserve the existing private-media boundary.
 */
export function classifyPrivateMediaInventory(objects) {
  if (!Array.isArray(objects)) throw new Error('Expected a complete object inventory.');
  const ids = new Set();
  const paths = new Set();
  const counts = { canonical: 0, legacyVerifiedOwner: 0, reviewRequired: 0 };
  const entries = objects.map(object => {
    if (!object || typeof object !== 'object' || !uuid.test(object.id ?? '')
      || ids.has(object.id)) throw new Error('Missing or duplicate object identity.');
    ids.add(object.id);
    const { bucket_id: bucket, name } = object;
    if (!mediaBuckets.has(bucket) || typeof name !== 'string' || !name
      || /[\u0000-\u001f\u007f\\]/.test(name)
      || name.split('/').some(part => !part || part === '.' || part === '..')) {
      throw new Error('Unexpected bucket or unsafe storage path; review required.');
    }
    const key = `${bucket}/${name}`;
    if (paths.has(key)) throw new Error('Duplicate storage path.');
    paths.add(key);
    const current = object.owner_id || null;
    const legacy = object.owner || null;
    let status, reason;
    if ((current && !uuid.test(current)) || (legacy && !uuid.test(legacy))) {
      status='reviewRequired'; reason='Invalid recorded owner';
    } else if (current && legacy && current.toLowerCase() !== legacy.toLowerCase()) {
      status='reviewRequired'; reason='Conflicting recorded owners';
    } else if (!current && !legacy) {
      status='reviewRequired'; reason='No recorded owner; do not infer from a filename or post';
    } else {
      const owner = (current || legacy).toLowerCase();
      status = name.split('/')[0] === owner ? 'canonical' : 'legacyVerifiedOwner';
      reason = status === 'canonical' ? 'Owner namespace matches recorded owner'
        : 'Recorded owner verified; legacy-path compatibility still required';
    }
    counts[status]++;
    return { id: object.id, bucket, name, status, reason };
  });
  return { total: entries.length, counts, entries, mutationPerformed: false };
}

/** Prepare DDL for review only. Never opens a DB, changes buckets or moves bytes.
 * The historical read-boundary migration embeds development's canonical origin.
 * Applying it unchanged in production would deny valid production references.
 */
export async function preparePrivateMediaBoundary(projectRef) {
  if (![development, production].includes(projectRef)) throw new Error('Select a reviewed CLIPT project.');
  const source = await readFile(new URL('../supabase/migrations/20261003214916_secure_private_media_read_eligibility.sql', import.meta.url), 'utf8');
  const expected = `https://${development}.supabase.co`;
  if (source.split(expected).length !== 2) throw new Error('Unexpected media migration template; review required.');
  return source.replace('CREATE FUNCTION clipt_private.storage_read_eligible(', 'CREATE OR REPLACE FUNCTION clipt_private.storage_read_eligible(')
    .replace(expected, `https://${projectRef}.supabase.co`)
    .replace('CREATE POLICY clipt_storage_read_eligibility_boundary ON storage.objects',
      'DROP POLICY IF EXISTS clipt_storage_read_eligibility_boundary ON storage.objects;\nCREATE POLICY clipt_storage_read_eligibility_boundary ON storage.objects');
}

/** Compatibility for explicitly registered legacy objects, without copy/move.
 * Registry population is a separate reviewed, exact-identity server operation.
 * Ownerless/conflicting records are never registered by this preparation step.
 */
export async function prepareLegacyMediaBoundary(projectRef) {
  const base = await preparePrivateMediaBoundary(projectRef);
  const registry = await readFile(new URL('../supabase/release/legacy-media-registry.sql',import.meta.url),'utf8');
  const oldCheck = "IF owner_text IS NULL OR split_part(object_name,'/',1) IS DISTINCT FROM owner_text THEN RETURN false; END IF;";
  if (!base.includes(oldCheck)) throw new Error('Media ownership boundary changed; review required.');
  return base.replace('CREATE OR REPLACE FUNCTION clipt_private.storage_read_eligible(',
    () => registry+'\nCREATE OR REPLACE FUNCTION clipt_private.storage_read_eligible(')
    .replace(oldCheck,"IF owner_text IS NULL THEN RETURN false; END IF;\n  IF split_part(object_name,'/',1) IS DISTINCT FROM owner_text AND NOT clipt_private.legacy_media_path_matches(object_bucket,object_name,owner_text) THEN RETURN false; END IF;");
}
