import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Image, Play, Heart, MessageSquare } from 'lucide-react';
import { usePrivateMediaUrl } from '@/hooks/usePrivateMedia';
import { postImageReferences } from '@/lib/post-image-references';

interface ProfilePostTileProps {
  post: { id: string; content?: string | null; image_url?: string | null; video_url?: string | null; games?: { id: string | number; name: string } | null };
  likes: number;
  comments: number;
}

export default function ProfilePostTile({ post, likes, comments }: ProfilePostTileProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const media = usePrivateMediaUrl(postImageReferences(post.image_url)[0]);
  return <article className="clipt-profile-tile"><Link to={`/post/${post.id}`} className="block" aria-label={`Open ${post.video_url ? 'Clipt' : 'post'}: ${post.content || 'Untitled'}`}>
    <div className="clipt-profile-thumbnail">
      {media.src && failedSrc !== media.src ? <img src={media.src} alt="" loading="lazy" onError={() => setFailedSrc(media.src ?? null)} /> : <div className="clipt-profile-thumbnail-empty">{post.video_url ? <Play aria-hidden="true" /> : <Image aria-hidden="true" />}<span>{media.isLoading ? 'Loading image…' : media.error ? 'Image unavailable' : post.video_url ? 'Watch Clipt' : 'View post'}</span></div>}
      <span className="clipt-profile-media-kind" aria-hidden="true">{post.video_url ? <Play size={16} /> : <Image size={16} />}</span>
    </div>
    <div className="clipt-profile-tile-caption"><p>{post.content || 'Untitled'}</p><div><span><Heart size={13} aria-hidden="true" />{likes.toLocaleString()}<span className="sr-only"> likes</span></span><span><MessageSquare size={13} aria-hidden="true" />{comments.toLocaleString()}<span className="sr-only"> comments</span></span></div></div>
  </Link>
    {post.games?.id && <Link to={`/game/${post.games.id}`} className="flex min-h-11 items-center px-3 py-2 underline">Playing {post.games.name}</Link>}
  </article>;
}
