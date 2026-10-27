import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, UserPlus, MessageCircle, AtSign, Heart, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { notificationLink } from '@/lib/notification-link';
import { PhotoSafetyNotices } from '@/components/settings/PhotoSafetyNotices';

const filters = ['all', 'follow', 'comment', 'mention', 'like'] as const;
const labels = { all: 'All', follow: 'Follows', comment: 'Comments', mention: 'Mentions', like: 'Likes' };
const activityIcons = { all: Bell, follow: UserPlus, comment: MessageCircle, reply: MessageCircle, mention: AtSign, like: Heart, stream_live: Radio };

export default function Notifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const [filter, setFilter] = useState<typeof filters[number]>('all');
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['notifications', userId, filter],
    enabled: Boolean(userId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!userId) throw new Error('Sign in to view notifications');
      let request = supabase.from('notifications')
        .select('id,type,content,created_at,read,resource_id,resource_type,actor:profiles!notifications_actor_id_fkey(username)')
        .eq('user_id', userId).order('created_at', { ascending: false }).order('id', { ascending: false });
      if (filter === 'comment') request = request.in('type', ['comment', 'reply']);
      else if (filter !== 'all') request = request.eq('type', filter);
      const { data, error } = await request.range(pageParam, pageParam + 24).retry(false);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, pages) => lastPage.length === 25 ? pages.length * 25 : undefined,
  });
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Sign in to update notifications');
      const { error } = await supabase.from('notifications').update({ read: true })
        .eq('id', id).eq('user_id', userId).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
    onError: () => toast.error('Could not mark this notification as read'),
  });
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`notification-page:${userId}`).on('postgres_changes', {
      event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`,
    }, () => { void queryClient.invalidateQueries({ queryKey: ['notifications', userId] }); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, queryClient]);
  const notifications = [...new Map((query.data?.pages.flat() ?? []).map(row => [row.id, row])).values()];
  return <main className="clipt-notifications clipt-auth min-h-64 mx-auto max-w-6xl p-4 space-y-5">
    <h1 className="flex items-center gap-2 text-2xl font-bold"><Bell aria-hidden="true" /> Notifications</h1>
    <PhotoSafetyNotices />
    <div className="clipt-filter-bar flex flex-wrap gap-2" role="group" aria-label="Notification filters">
      {filters.map(value => { const Icon = activityIcons[value]; return <Button key={value} variant={filter === value ? 'default' : 'outline'}
        aria-pressed={filter === value} onClick={() => setFilter(value)}><Icon aria-hidden="true"/>{labels[value]}</Button>; })}
    </div>
    {query.isPending ? <p role="status">Loading notifications…</p> : query.isError ? <div role="alert">
      <p>Notifications could not be loaded. Your notifications have not been cleared.</p>
      <Button onClick={() => query.refetch()}>Retry</Button>
    </div> : <>
      {notifications.length === 0 && <p role="status">No notifications in this category yet.</p>}
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{notifications.map(notification => {
        const href = notificationLink(notification.resource_type, notification.resource_id);
        const actor = notification.actor?.username || 'A Clipt member';
        const action = { follow: 'followed you', like: 'liked your Clipt', comment: 'commented on your Clipt',
          reply: 'replied to your comment', mention: 'mentioned you', stream_live: 'went live', system_alert: null }[notification.type];
        const text = action ? `${actor} ${action}` : notification.content || 'New activity';
        const ActivityIcon = activityIcons[notification.type as keyof typeof activityIcons] || Bell;
        return <li key={notification.id} className="clipt-notification-item rounded-xl border border-purple-500/40 bg-slate-950 p-4">
          <span className="clipt-notification-icon" aria-hidden="true"><ActivityIcon/></span><div className="min-w-0 space-y-2">
          {href ? <Link className="block text-purple-200 underline-offset-4 hover:underline" to={href}
            onClick={() => { if (!notification.read) markRead.mutate(notification.id); }}>{text}</Link> : <p>{text}</p>}
          <time className="block text-xs text-slate-300" dateTime={notification.created_at}>
            {new Date(notification.created_at).toLocaleString()}
          </time>
          {!notification.read && <Button size="sm" variant="outline" disabled={markRead.isPending}
            onClick={() => markRead.mutate(notification.id)}>Mark as read</Button>}
        </div></li>;
      })}</ul>
      {query.hasNextPage && <Button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
        {query.isFetchingNextPage ? 'Loading…' : 'Load more notifications'}
      </Button>}
    </>}
  </main>;
}
