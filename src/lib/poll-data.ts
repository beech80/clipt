export interface PollOptionData { id: string; text: string; votes: number }

export function readPollOptions(value: unknown): PollOptionData[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap(option => {
    if (!option || typeof option !== 'object' || typeof option.id !== 'string' || !option.id ||
      typeof option.text !== 'string' || !option.text.trim() || ids.has(option.id)) return [];
    ids.add(option.id);
    return [{ id: option.id, text: option.text, votes: Number.isSafeInteger(option.votes) && option.votes >= 0 ? option.votes : 0 }];
  });
}
