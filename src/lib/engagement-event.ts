export function readEngagementUpdate(value: unknown, postId: string): { active: boolean; count: number } | null {
  if (!value || typeof value !== 'object') return null;
  const detail = value as Record<string, unknown>;
  if (detail.postId !== postId || typeof detail.active !== 'boolean' ||
      typeof detail.count !== 'number' || !Number.isSafeInteger(detail.count) || detail.count < 0) return null;
  return { active: detail.active, count: detail.count };
}
