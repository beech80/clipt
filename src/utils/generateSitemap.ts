import { supabase } from "@/lib/supabase";

export const generateSitemap = async () => {
  const baseUrl = window.location.origin;
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static routes
  sitemap += `
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  // Add posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  posts?.forEach(post => {
    sitemap += `
  <url>
    <loc>${baseUrl}/post/${post.id}</loc>
    <lastmod>${post.created_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  // Add user profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username');

  profiles?.forEach(profile => {
    if (profile.username) {
      sitemap += `
  <url>
    <loc>${baseUrl}/profile/${profile.username}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  });

  sitemap += `
</urlset>`;

  return sitemap;
};