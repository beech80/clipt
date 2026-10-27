// Private preferences and verification-review data must never be requested by
// a public profile query. Owner settings use get_own_profile(), without an ID.
export const publicProfileFields = 'id,username,avatar_url,created_at,bio,website,display_name,is_moderator,bio_description,location,custom_theme,social_links,is_verified' as const;
