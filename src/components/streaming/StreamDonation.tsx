import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface StreamDonationProps { streamId: string; streamerUsername: string; streamerId: string; className?: string }

export const StreamDonation = ({ streamId, streamerUsername, streamerId, className = '' }: StreamDonationProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const retry = useRef<{ identity: string; key: string } | null>(null);
  const { data: gifts, error, isLoading } = useQuery({
    queryKey: ['virtual-gifts', 'purchasable'],
    queryFn: async () => {
      const { data, error } = await supabase.from('virtual_gifts').select('id, name, price, description')
        .eq('is_active', true).order('price').limit(100);
      if (error) throw error;
      return data.filter(gift => Number.isSafeInteger(gift.price) && gift.price > 0 && gift.price <= 1000000);
    },
    enabled: open && !!user,
    retry: false,
  });
  const wallet = useQuery({
    queryKey: ['token-wallet', user?.id], enabled: open && Boolean(user), retry: false,
    queryFn: async () => {
      const {data,error} = await supabase.from('token_wallets').select('balance,updated_at').eq('user_id',user!.id).maybeSingle().retry(false);
      if(error) throw error;
      return data;
    },
  });
  const price = gifts?.find(gift => gift.id === selected)?.price;
  const purchase = async () => {
    if (!user || !selected || pendingRef.current || user.id === streamerId) return;
    pendingRef.current = true; setPending(true);
    const identity = JSON.stringify([user.id, streamId, selected, message.trim()]);
    if (retry.current?.identity !== identity) retry.current = { identity, key: crypto.randomUUID() };
    try {
      const { data, error } = await supabase.rpc('purchase_stream_gift', {
        p_stream_id: streamId, p_gift_id: selected, p_idempotency_key: retry.current.key, p_message: message.trim(),
      });
      if (error) throw error;
      if (typeof data !== 'string' || !data) throw new Error('Unconfirmed purchase');
      retry.current = null;
      await Promise.all(['token-wallet', 'token-ledger', 'stream-gifts'].map(key => queryClient.invalidateQueries({ queryKey: [key] })));
      toast.success('Virtual gift purchased');
      setOpen(false); setMessage('');
    } catch {
      toast.error('Gift purchase could not be confirmed. Check your token balance, then retry.');
    } finally { pendingRef.current = false; setPending(false); }
  };
  return <Dialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }}>
    <DialogTrigger asChild><Button data-live-action="trophy" className={className}>Support with a gift</Button></DialogTrigger>
    <DialogContent className="clipt-stream-gift-dialog max-w-md"><DialogHeader><DialogTitle>Support {streamerUsername}</DialogTitle></DialogHeader>
      <p>Purchase a virtual gift using Clipt tokens. This does not transfer a token balance to another user.</p>
      {user ? <p>{wallet.isError ? 'Balance unavailable.' : wallet.isPending ? 'Loading balance…' : `Balance: ${(wallet.data?.balance ?? 0).toLocaleString()} tokens`}</p> : null}
      <Link className="underline" to="/tokens">View token balance and history</Link>
      {!user ? <p>Sign in to purchase gifts.</p> : error ? <p role="alert">The gift catalog is unavailable.</p> : isLoading ? <p role="status">Loading gifts…</p> : <>
        <label htmlFor="stream-gift">Gift</label>
        <select id="stream-gift" value={selected} onChange={event => setSelected(event.target.value)} disabled={pending} className="rounded border bg-background p-2">
          <option value="">Choose a gift</option>
          {gifts?.map(gift => <option key={gift.id} value={gift.id}>{gift.name} — {gift.price} tokens</option>)}
        </select>
        {!gifts?.length && <p>No gift products are currently available.</p>}
        <label htmlFor="gift-message">Message (optional)</label>
        <textarea id="gift-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={200} disabled={pending} className="rounded border bg-background p-2" />
        {price !== undefined && !wallet.isPending && !wallet.isError && (wallet.data?.balance ?? 0) < price ? <p role="status">Insufficient tokens for this gift.</p> : null}
        <Button onClick={() => void purchase()} disabled={pending || !selected || user.id === streamerId || wallet.isPending || wallet.isError || price === undefined || (wallet.data?.balance ?? 0) < price}>{pending ? 'Purchasing…' : 'Purchase gift'}</Button>
      </>}
    </DialogContent>
  </Dialog>;
};
export default StreamDonation;
