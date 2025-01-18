import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting sitemap regeneration...')

    // Fetch all published posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('is_published', true)

    if (postsError) throw postsError

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('username')
      .not('username', 'is', null)

    if (profilesError) throw profilesError

    // Generate sitemap XML
    const baseUrl = 'https://your-app-url.com' // Replace with your actual domain
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/discover</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/streaming</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/top-clips</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`

    // Add posts to sitemap
    posts?.forEach(post => {
      sitemap += `
  <url>
    <loc>${baseUrl}/post/${post.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    })

    // Add profiles to sitemap
    profiles?.forEach(profile => {
      sitemap += `
  <url>
    <loc>${baseUrl}/profile/${profile.username}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    sitemap += '\n</urlset>'

    // Store the sitemap in Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('public')
      .upload('sitemap.xml', sitemap, {
        contentType: 'application/xml',
        upsert: true
      })

    if (uploadError) throw uploadError

    console.log('Sitemap regeneration completed successfully')

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error regenerating sitemap:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})