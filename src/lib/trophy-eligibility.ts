/** Mirror target eligibility for UX only. Database RLS remains authoritative. */
export function trophyIneligibility(post: {video_url?: string|null; post_type?: string|null; is_published?: boolean; is_premium?: boolean; is_subscriber_only?: boolean}) {
  if (post.is_published !== true) return 'Trophies are available after a public video is published.';
  if (post.post_type === 'squad' || post.is_premium || post.is_subscriber_only) return 'Trophy rankings are for public videos, not private or subscriber-only posts.';
  if (!post.video_url?.trim()) return 'Photos can receive Likes. Trophy rankings are currently for public videos.';
  if (!['clipt','clipts','video'].includes(post.post_type || '')) return 'This post is not eligible for public video Trophy rankings.';
  return null;
}
export function trophyVoteError(error: {code?: string}) {
  return error.code === '42501' ? 'This video is not currently eligible for a Trophy, or your account cannot vote. Refresh it and check your sign-in/MFA status.'
    : error.code === '23505' ? 'Your Trophy is already recorded. Refresh to see its current count.' : 'Your Trophy could not be confirmed. Refresh and try again.';
}
