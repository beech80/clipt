import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { loadProfileConnections, type ConnectionKind } from '@/lib/profile-connections';

export default function ProfileConnectionsDialog({ profileId, kind, onClose }: { profileId: string; kind: ConnectionKind; onClose: () => void }) {
  const { user } = useAuth();
  const [returnFocusTo] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null);
  const [page, setPage] = useState(0);
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['profile-connections', user?.id, profileId, kind, page], retry: false,
    queryFn: () => loadProfileConnections(supabase, profileId, kind, page),
  });
  const title = kind === 'followers' ? 'Followers' : 'Following';
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="clipt-message-picker clipt-connections-dialog" onCloseAutoFocus={event => {
      if (returnFocusTo?.isConnected) { event.preventDefault(); returnFocusTo.focus(); }
    }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>People visible to your account. Select a person to view their profile.</DialogDescription>
      {isPending && !error && <p role="status">Loading {title.toLowerCase()}…</p>}
      {error && <div role="alert"><p>Could not load {title.toLowerCase()}.</p><Button disabled={isFetching} onClick={() => void refetch()}>Retry list</Button></div>}
      {data && !error && <>
        {!data.profiles.length && <p role="status">No visible {title.toLowerCase()} on this page.</p>}
        <ul className="space-y-2">
          {data.profiles.map(profile => <li key={profile.id}><Link to={`/user/${profile.id}`} onClick={onClose}
            className="flex min-h-11 items-center gap-3 rounded-lg border border-violet-500/30 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300">
            <Avatar className="shrink-0"><AvatarImage src={profile.avatar_url || undefined} alt="" /><AvatarFallback>{(profile.username || profile.display_name || 'U')[0]}</AvatarFallback></Avatar>
            <span className="min-w-0 [overflow-wrap:anywhere]">{profile.display_name || profile.username || 'User'}{profile.username && <span className="block text-sm text-violet-200">@{profile.username}</span>}</span>
          </Link></li>)}
        </ul>
        <div className="flex justify-between gap-2"><Button disabled={page === 0 || isFetching} onClick={() => setPage(current => current - 1)}>Previous</Button><Button disabled={!data.hasNext || isFetching} onClick={() => setPage(current => current + 1)}>Next</Button></div>
      </>}
    </DialogContent>
  </Dialog>;
}
