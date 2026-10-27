type SafeLogValue = null | boolean | number | string | SafeLogValue[] | { [key: string]: SafeLogValue };
const sensitive = /password|secret|token|authorization|cookie|stream.?key|rtmp.?key|private.?message|message.?content|^content$|^body$/i;
export function redactLogValue(value: unknown, depth = 0): SafeLogValue {
  if (depth > 5) return '[truncated]';
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    return value.slice(0, 1000).replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]')
      .replace(/(https?:\/\/[^\s?#]+)[?#][^\s]*/g, '$1');
  }
  if (Array.isArray(value)) return value.slice(0, 50).map(item => redactLogValue(item, depth + 1));
  if (typeof value !== 'object') return '[unsupported]';
  return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, item]) =>
    [key, sensitive.test(key) ? '[redacted]' : redactLogValue(item, depth + 1)]));
}
