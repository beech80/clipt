import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';
import { ShieldCheck } from 'lucide-react';

export const TwoFactorSettings = () => {
  const { factors, enrollment, error: loadError, loading, enroll, verifyEnrollment, cancelEnrollment, removeFactor } = useAuthSecurity();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const run = async (action: () => Promise<void>, success: string) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await action(); setCode(''); setNotice(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Authenticator request failed.'); }
    finally { setBusy(false); }
  };

  return <Card className="clipt-security-panel border-purple-500/50 rounded-xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-3"><ShieldCheck aria-hidden="true" className="clipt-security-symbol shrink-0" />Two-Factor Authentication</CardTitle>
      <CardDescription>Use an authenticator app to verify your Clipt account. Setup is incomplete until a code is accepted.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {loading && <p role="status">Loading account security…</p>}
      {(error || loadError) && <p role="alert">{error || loadError}</p>}
      {notice && <p role="status">{notice}</p>}
      {!loading && !loadError && <>
        <p>{factors.length ? 'Authenticator verified on your account.' : 'No verified authenticator on your account.'}</p>
        {enrollment ? <>
          <p>Scan this QR code in your authenticator app. Keep the setup key private.</p>
          <img src={enrollment.qrCode} alt="Authenticator setup QR code" width={200} height={200} />
          <details><summary>Enter setup key manually</summary><code className="break-all">{enrollment.secret}</code></details>
        </> : !factors.length && <Button disabled={busy} onClick={() => void run(enroll, '')}>Set up authenticator</Button>}
        {(enrollment || factors.length > 0) && <>
          <label htmlFor="settings-mfa-code">Current authenticator code</label>
          <Input id="settings-mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={code} onChange={event => setCode(event.target.value)} />
        </>}
        {enrollment && <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void run(() => verifyEnrollment(code), 'Authenticator verification completed.')}>Verify setup</Button>
          <Button variant="outline" disabled={busy} onClick={() => void run(cancelEnrollment, 'Setup cancelled.')}>Cancel setup</Button>
        </div>}
        {factors.map(factor => <Button key={factor.id} variant="outline" disabled={busy}
          onClick={() => void run(() => removeFactor(factor.id, code), 'Authenticator removed.')}>
          Verify code and remove {factor.friendly_name || 'authenticator'}
        </Button>)}
        <p className="text-sm text-muted-foreground">No recovery codes are generated here. Keep access to your authenticator; contact support if you lose it.</p>
      </>}
    </CardContent>
  </Card>;
};
