export function profileWebsite(value?: string | null): string | null {
  const text = value?.trim();
  if (!text || /[\s\u0000-\u001f\u007f]/u.test(text)) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
