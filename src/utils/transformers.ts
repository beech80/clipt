/**
 * Utility functions to transform database data into app-friendly formats
 */

/**
 * Transform posts data from database format to app format
 */
export const transformPostsFromDb = (dbPosts: any[] = []) => {
  if (!dbPosts || !Array.isArray(dbPosts)) {
    console.error('Invalid posts data:', dbPosts);
    return [];
  }

  return dbPosts.map(post => ({
    id: post.id || '',
    title: post.title || '',
    content: post.content || '',
    created_at: post.created_at || new Date().toISOString(),
    media_url: post.media_url || '',
    likes_count: typeof post.likes_count === 'number' ? post.likes_count : 0,
    comments_count: typeof post.comments_count === 'number' ? post.comments_count : 0,
    user_id: post.user_id || '',
    game_id: post.game_id || null,
    profiles: post.profiles || {},
    games: post.games || {},
  }));
};

/**
 * Transform games data from database format to app format
 */
export const transformGamesFromDb = (dbGames: any[] = []) => {
  if (!dbGames || !Array.isArray(dbGames)) {
    console.error('Invalid games data:', dbGames);
    return [];
  }

  return dbGames.map(game => ({
    id: game.id || '',
    name: game.name || 'Unknown Game',
    cover_url: game.cover_url || null,
    post_count: game.posts ? game.posts.length : 0,
  }));
};

/**
 * Transform streamers data from database format to app format
 */
export const transformStreamersFromDb = (dbStreamers: any[] = []) => {
  if (!dbStreamers || !Array.isArray(dbStreamers)) {
    console.error('Invalid streamers data:', dbStreamers);
    return [];
  }

  return dbStreamers.map(streamer => ({
    id: streamer.id || '',
    username: streamer.username || 'unknown_user',
    display_name: streamer.display_name || streamer.username || 'Unknown User',
    avatar_url: streamer.avatar_url || null,
    streaming_url: streamer.streaming_url || null,
    is_live: Boolean(streamer.is_live),
    follower_count: typeof streamer.follower_count === 'number' ? streamer.follower_count : 0,
    current_game: streamer.current_game || null,
  }));
};
