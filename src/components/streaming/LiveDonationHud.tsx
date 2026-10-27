import { useState } from 'react';
import { DollarSign, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { donationAmountCents } from '@/lib/donation-amount';

export default function LiveDonationHud({ creator, disabled }: { creator: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [amount, setAmount] = useState('5');
  const [custom, setCustom] = useState(false);
  const [message, setMessage] = useState('');
  const cents = donationAmountCents(amount);
  const formatted = cents === null ? null : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  return <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) setConfirm(false); }}>
    <DialogTrigger asChild><Button data-live-action="trophy" disabled={disabled}><DollarSign aria-hidden="true" className="mr-2 h-4 w-4" />Donate</Button></DialogTrigger>
    <DialogContent className="clipt-donation-hud" aria-describedby="donation-provider-status">
      <DialogHeader><DialogTitle className="pr-8 text-xl">{confirm ? 'Confirm Donation' : `Support ${creator}`}</DialogTitle>
        <DialogDescription id="donation-provider-status">Development sandbox checkout is not connected. No payment will be taken.</DialogDescription></DialogHeader>
      {!confirm ? <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (cents !== null) setConfirm(true); }}>
        <fieldset><legend className="mb-3">Donation amount (USD)</legend><div className="clipt-donation-amounts">
          {[1,5,10,25,50].map(value => <Button key={value} type="button" variant="outline" aria-pressed={!custom && amount === String(value)} onClick={() => { setAmount(String(value)); setCustom(false); }}>${value}</Button>)}
          <Button type="button" variant="outline" aria-pressed={custom} onClick={() => { setCustom(true); setAmount(''); }}>Custom</Button>
        </div></fieldset>
        {custom && <label className="block space-y-2"><span>Custom amount, $1–$500</span><Input type="text" inputMode="decimal" autoComplete="off" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" aria-invalid={Boolean(amount) && cents === null} />{amount && cents === null && <span role="alert" className="text-sm text-red-200">Enter $1–$500 with at most two decimal places.</span>}</label>}
        <label className="block space-y-2"><span>Message (optional)</span><Textarea value={message} maxLength={150} onChange={event => setMessage(event.target.value)} placeholder="Support their next moment…" /></label>
        <p className="text-xs text-purple-200">{message.length}/150 · Real-money donations are separate from Tokens, gifts and organic Trophy votes.</p>
        <Button type="submit" disabled={cents === null} className="w-full"><Heart aria-hidden="true" className="mr-2 h-4 w-4" />Continue to review</Button>
      </form> : <section className="space-y-4" aria-label="Donation review">
        <dl className="clipt-donation-summary"><div><dt>Streamer</dt><dd>{creator}</dd></div><div><dt>Donation amount</dt><dd>{formatted}</dd></div><div><dt>Message</dt><dd>{message.trim() || 'No message'}</dd></div><div><dt>Payment method</dt><dd>Sandbox provider not configured</dd></div><div><dt>Fees / total</dt><dd>Unavailable until the provider supplies a verified quote</dd></div></dl>
        <p role="status">Payment is unavailable. This review does not create or confirm a transaction.</p>
        <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => setConfirm(false)}>Change amount</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div>
        <Button className="w-full" disabled>Confirm Donation — sandbox unavailable</Button>
      </section>}
    </DialogContent>
  </Dialog>;
}
