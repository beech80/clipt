// Server-only adapter. Callers must obtain content from an authorized server
// snapshot, never accept these fields or image bytes from a browser request.
const categories = ['Hate', 'SelfHarm', 'Sexual', 'Violence'] as const
export function publicReviewEligible(post: Record<string, unknown>, owner: string) {
  return post.user_id === owner && post.is_published === true
    && post.is_premium === false && post.is_subscriber_only === false
    && post.required_tier_id === null && post.moderation_hidden === false
    && ['clipt', 'regular', 'photo'].includes(String(post.post_type))
    && typeof post.image_url === 'string' && post.image_url.length > 0
    && post.video_url === null
}

export function azureReviewDecision(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Moderation response unavailable')
  const rows = (value as { categoriesAnalysis?: unknown }).categoriesAnalysis
  if (!Array.isArray(rows) || rows.length !== categories.length) throw new Error('Moderation response unavailable')
  const seen = new Set<string>()
  let flagged = false
  for (const row of rows) {
    if (!row || !categories.includes(row.category) || seen.has(row.category)
      || ![0, 2, 4, 6].includes(row.severity)) throw new Error('Moderation response unavailable')
    seen.add(row.category)
    flagged ||= row.severity >= 2
  }
  // Not a safety guarantee or authorization to publish/delete/ban.
  return flagged ? 'needs_review' : 'no_flag_detected'
}

export async function analyzeAzureReview(config: { endpoint: string; key: string; tier: string; verifiedF0: boolean },
  input: { caption?: string; imageBase64?: string }, fetcher: typeof fetch = fetch) {
  const url = new URL(config.endpoint)
  if (!config.verifiedF0 || config.tier !== 'F0' || !config.key
    || url.protocol !== 'https:' || !/^[a-z0-9-]+\.cognitiveservices\.azure\.com$/.test(url.hostname)
    || url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Verified free-tier moderation configuration required')
  }
  if ((input.caption === undefined) === (input.imageBase64 === undefined)) throw new Error('One moderation input required')
  const image = input.imageBase64 !== undefined
  const content = image ? input.imageBase64! : input.caption!
  if (typeof content !== 'string' || !content.trim() || content.length > (image ? 5_500_000 : 500)
    || (image && (!/^[A-Za-z0-9+/]+={0,2}$/.test(content) || content.length % 4 !== 0))) throw new Error('Invalid moderation input')
  const path = image ? 'image' : 'text'
  let response: Response
  try {
    response = await fetcher(new URL(`contentsafety/${path}:analyze?api-version=2024-09-01`, url), {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: {'Content-Type':'application/json', 'Ocp-Apim-Subscription-Key':config.key},
      body: JSON.stringify({ ...(image ? {image:{content}} : {text:content}), categories, outputType:'FourSeverityLevels' }),
    })
  } catch { throw new Error('Moderation temporarily unavailable') }
  if (response.status === 429) throw new Error('Moderation quota reached; review remains pending')
  if (!response.ok) throw new Error('Moderation temporarily unavailable')
  // Bound response bytes; never log caption, image, key or raw provider errors.
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Moderation response unavailable')
  let size=0; const parts: Uint8Array[]=[]
  while (true) {
    const next=await reader.read(); if(next.done)break
    size+=next.value.byteLength
    if(size>16384){await reader.cancel();throw new Error('Moderation response unavailable')}
    parts.push(next.value)
  }
  const bytes=new Uint8Array(size);let offset=0
  for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}
  try { return azureReviewDecision(JSON.parse(new TextDecoder().decode(bytes))) }
  catch { throw new Error('Moderation response unavailable') }
}
