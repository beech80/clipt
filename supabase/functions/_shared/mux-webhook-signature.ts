// Staged primitive only. No endpoint is enabled and no events write live state.
export async function verifyMuxSignature(raw: Uint8Array, header: string | null, secret: string, nowSeconds = Date.now() / 1000): Promise<boolean> {
  if (!header || header.length > 4096 || !secret || raw.byteLength > 65536 || !Number.isFinite(nowSeconds)) return false;
  const parts = header.split(',').map(part => part.trim());
  const timestamps = parts.filter(part => part.startsWith('t='));
  if (timestamps.length !== 1 || !/^t=\d{1,12}$/.test(timestamps[0])) return false;
  const stamp = timestamps[0].slice(2);
  if (Math.abs(nowSeconds - Number(stamp)) > 300) return false;
  const signatures = parts.filter(part => /^v1=[a-fA-F0-9]{64}$/.test(part));
  if (!signatures.length) return false;
  const prefix = new TextEncoder().encode(stamp + '.');
  const payload = new Uint8Array(prefix.length + raw.length);
  payload.set(prefix); payload.set(raw, prefix.length);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['verify']);
  for (const signature of signatures) {
    const bytes = Uint8Array.from(signature.slice(3).match(/../g)!, pair => parseInt(pair,16));
    if (await crypto.subtle.verify('HMAC', key, bytes, payload)) return true;
  }
  return false;
}
