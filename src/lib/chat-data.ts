import { z } from 'zod';

export const chatSettingsSchema = z.object({
  slow_mode: z.boolean().default(false),
  slow_mode_interval: z.number().int().min(1).max(3600).default(5),
  subscriber_only: z.boolean().default(false),
  follower_only: z.boolean().default(false),
  follower_time_required: z.number().int().min(0).max(525600).default(0),
  emote_only: z.boolean().default(false),
  auto_mod_settings: z.object({
    enabled: z.boolean().default(true),
    spam_detection: z.boolean().default(true),
    link_protection: z.boolean().default(true),
    caps_limit_percent: z.number().min(0).max(100).default(80),
    max_emotes: z.number().int().min(0).max(100).default(20),
    blocked_terms: z.array(z.string().max(200)).max(1000).default([]),
  // Parse missing settings through the nested defaults, as Zod 3 did.
  // Zod 4's .default({}) would return an empty object without safety defaults.
  }).prefault({}),
});

export type ChatSettingsData = z.infer<typeof chatSettingsSchema>;

/** Missing/malformed moderation output is not permission to publish a draft. */
export function parseChatFilterResult(value: unknown) {
  const parsed = z.array(z.object({
    is_blocked: z.boolean(),
    filtered_message: z.string().max(2000).nullable().optional(),
  })).length(1).safeParse(value);
  if (!parsed.success) throw new Error('Chat moderation could not be confirmed. Please retry.');
  const result = parsed.data[0];
  if (result.is_blocked) return { blocked: true as const };
  if (!result.filtered_message?.trim()) throw new Error('Chat moderation could not be confirmed. Please retry.');
  return { blocked: false as const, message: result.filtered_message };
}

const emoteSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  created_at: z.string(),
  created_by: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  animated: z.boolean().nullable().optional(),
  permissions: z.object({
    subscriber_only: z.boolean().default(false),
    moderator_only: z.boolean().default(false),
  }).nullable().optional(),
});

export function parseChatEmotes(rows: unknown[]) {
  return rows.flatMap(row => {
    const parsed = emoteSchema.safeParse(row);
    if (!parsed.success) return [];
    const emote = parsed.data;
    return [{
      id: emote.id, name: emote.name, url: emote.url, created_at: emote.created_at,
      created_by: emote.created_by, category: emote.category, animated: emote.animated,
      permissions: emote.permissions ? {
        subscriber_only: emote.permissions.subscriber_only,
        moderator_only: emote.permissions.moderator_only,
      } : undefined,
    }];
  });
}
