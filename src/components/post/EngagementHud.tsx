import { Link } from 'react-router-dom';
import { HashtagText } from '@/components/post/HashtagText';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Heart, MessageSquare, Share2, Trophy, X } from 'lucide-react';
import { DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CommentList } from './CommentList';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AdjustablePanel } from '@/components/AdjustablePanel';

export function CaptionText({ text }: { text: string }) {
  return <>{text.split(/(https?:\/\/[^\s<>]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="underline">{part}</a> : <HashtagText key={index} text={part} />)}</>;
}

export function EngagementHud({ postId, creatorId, username, caption, avatarUrl, followFeed = false }: {
  postId: string; creatorId?: string | null; username?: string | null; caption?: string | null; avatarUrl?: string | null; followFeed?: boolean;
}) {
  const { user } = useAuth();
  const [returnFocusTo] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null);
  const [shareStatus, setShareStatus] = useState('');
  const [sharing, setSharing] = useState(false);
  const shareInProgress = useRef(false);
  const dockRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dockRef.current?.scrollTo({ top: 0 });
    setShareStatus('');
  }, [postId]);
  const { data, error, refetch, isPending, isFetching } = useQuery({
    queryKey: ['engagement-hud', postId, user?.id],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from('post_views').select('id', { count: 'exact', head: true }).eq('post_id', postId),
        supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', postId),
        supabase.from('external_shares').select('id', { count: 'exact', head: true }).eq('post_id', postId),
        supabase.from('clip_votes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      ]);
      const failure = results.find(result => result.error)?.error;
      if (failure) throw failure;
      return results.map(result => result.count);
    },
  });
  const metrics = [{ label: 'Views', Icon: Eye }, { label: 'Likes', Icon: Heart },
    { label: 'Comments', Icon: MessageSquare }, { label: 'Shares', Icon: Share2 }, { label: 'Trophies', Icon: Trophy }];
  const Content = followFeed ? AdjustablePanel : DialogContent;
  return <Content ref={dockRef} className="clipt-engagement-hud max-w-xl p-5"
    onCloseAutoFocus={event => {
      if (!returnFocusTo?.isConnected && !followFeed) return;
      const target = returnFocusTo?.isConnected && returnFocusTo.getClientRects().length ? returnFocusTo
        : document.querySelector<HTMLButtonElement>('.clipt-controller-feed .clipt-controller-toggle');
      if (target?.isConnected && target.getClientRects().length) { event.preventDefault(); target.focus(); }
    }}
    onInteractOutside={event => {
      const target = event.target;
      if (target instanceof Element && (target.closest('[data-controller-action="comment"]') ||
        (followFeed && target.closest('.clipt-fyp-track')))) event.preventDefault();
    }}>
    <div className="clipt-comment-dock-header">
      <DialogTitle>Clipt engagement</DialogTitle>
      <DialogClose asChild><Button className="clipt-comment-dock-close" variant="ghost" size="icon" aria-label="Back to controls"><X size={20} aria-hidden="true" /></Button></DialogClose>
    </div>
    <DialogDescription className="clipt-hud-description text-violet-200">The conversation behind this Clipt.</DialogDescription>
    {(username || caption) && <div className="clipt-comment-post-details" aria-live="polite" aria-atomic="true">
      <Avatar className="clipt-portrait-comment-avatar" aria-hidden="true"><AvatarImage src={avatarUrl || undefined} alt="" /><AvatarFallback>{username?.slice(0, 1).toUpperCase() || '?'}</AvatarFallback></Avatar>
      {username && <p className="clipt-comment-author">{creatorId
        ? <Link className="inline-flex min-h-11 items-center underline" to={'/user/' + encodeURIComponent(creatorId)}>@{username}</Link>
        : '@' + username}</p>}
      {caption && <p className="clipt-comment-caption"><span className="clipt-original-caption"><CaptionText text={caption} /></span><span className="clipt-portrait-caption"><CaptionText text={caption} /></span></p>}
    </div>}
    {isPending && !error && <p role="status" className="text-sm text-violet-200">Loading engagement totals…</p>}
    <div className="clipt-engagement-metrics">
      {metrics.map(({ label, Icon }, index) => <div key={label}>
        <Icon size={18} className="mx-auto mb-1" aria-hidden="true" />
        <strong>{data?.[index] == null ? '—' : data[index].toLocaleString()}</strong><span>{label}</span>
      </div>)}
    </div>
    {error && <div role="alert" className="text-sm"><p>Engagement totals are unavailable.</p>
      <Button variant="ghost" disabled={isFetching} onClick={() => void refetch()}>Retry totals</Button></div>}
    <Button variant="outline" disabled={sharing} onClick={async () => {
      if (shareInProgress.current) return;
      shareInProgress.current = true;
      setSharing(true); setShareStatus('');
      const url = new URL('/post/' + encodeURIComponent(postId), window.location.origin).href;
      try {
        if (navigator.share) { await navigator.share({ title: 'Clipt', url }); setShareStatus('Share dialog completed.'); }
        else { await navigator.clipboard.writeText(url); setShareStatus('Clipt link copied.'); }
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) setShareStatus('Could not share this Clipt. Please try again.');
      } finally { shareInProgress.current = false; setSharing(false); }
    }}><Share2 size={16} className="mr-2" /> Share Clipt</Button>
    {shareStatus && <p role="status" className="text-sm">{shareStatus}</p>}
    <CommentList key={postId} postId={postId} className="clipt-hud-comments" bottomComposer hideReactions onCommentAdded={() => void refetch()} />
  </Content>;
}
