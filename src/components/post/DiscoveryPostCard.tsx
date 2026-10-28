import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { usePrivateMediaUrl } from '@/hooks/usePrivateMedia';
import { postImageReferences } from '@/lib/post-image-references';
import HashtagText from './HashtagText';

export default function DiscoveryPostCard({ post }: { post: {
  id: string; content: string | null; username?: string | null; user_id?: string | null;
  image_url?: string | null; avatar_url?: string | null; created_at?: string;
} }) {
  const preview = usePrivateMediaUrl(postImageReferences(post.image_url)[0]);
  const avatar = usePrivateMediaUrl(post.avatar_url);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const date = post.created_at ? new Date(post.created_at) : null;
  return <article className="clipt-discovery-card min-w-0 overflow-hidden rounded-2xl border border-purple-400/25 bg-slate-950/70">
    <Link to={`/post/${post.id}`} className="clipt-discovery-cover relative flex aspect-video items-center justify-center overflow-hidden bg-purple-950/40" aria-label={`Watch Clipt${post.username ? ' by @' + post.username : ''}`}>
      {preview.src && failedSrc !== preview.src
        ? <img src={preview.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailedSrc(preview.src ?? null)} />
        : <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#7e22ce44,transparent_70%)]" />}
      <span className="relative grid h-14 w-14 place-items-center rounded-full border border-violet-300/60 bg-black/65 text-white shadow-lg"><Play size={24} aria-hidden="true" /></span>
      <span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs text-violet-100">CLIPT</span>
    </Link>
    <div className="space-y-3 p-4">
      {post.user_id && post.username && <Link className="inline-flex min-h-11 max-w-full items-center gap-2 font-semibold text-purple-100" to={`/user/${post.user_id}`}>
        <Avatar className="h-8 w-8 shrink-0" aria-hidden="true"><AvatarImage src={avatar.src} alt="" /><AvatarFallback>{post.username.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
        <span className="min-w-0 break-all">@{post.username}</span>
      </Link>}
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200 [overflow-wrap:anywhere]"><HashtagText text={post.content || 'Untitled Clipt'} /></p>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-purple-400/15 pt-3">
        {date && Number.isFinite(date.valueOf()) && <time dateTime={date.toISOString()} className="text-xs text-slate-400">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>}
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-purple-400/50 bg-purple-500/10 px-3 text-sm text-purple-100" to={`/post/${post.id}`}>Open Clipt<ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
    </div>
  </article>;
}
