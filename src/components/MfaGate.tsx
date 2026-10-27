import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { needsMfaChallenge, validateAuthenticatorCode } from '@/lib/mfa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Client navigation protection complements, but does not replace, server AAL policies.
export function MfaGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const userId = user?.id;
  const [revision, setRevision] = useState(0);
  const [checkedUser, setCheckedUser] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setCheckedUser(null);
      setRevision(value => value + 1);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let disposed = false;
    setCheckedUser(null);
    setFactorId(null);
    setCode('');
    setError('');
    if (!userId) return;
    void (async () => {
      try {
        const { data, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (!data) throw new Error('Unable to check account security.');
        // Enrollment may change in another session. Do not rely only on the
        // factor list cached in this session's user object.
        const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
        if (factorError) throw factorError;
        const verifiedFactors = factors.all.filter(factor => factor.status === 'verified');
        let requiredFactor: string | null = null;
        if (needsMfaChallenge({ ...data, nextLevel: verifiedFactors.length ? 'aal2' : data.nextLevel })) {
          requiredFactor = verifiedFactors.find(factor => factor.factor_type === 'totp')?.id ?? null;
          if (!requiredFactor) throw new Error('No supported authenticator is available. Contact account support.');
        }
        if (!disposed) {
          setFactorId(requiredFactor);
          setCheckedUser(userId);
        }
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : 'Unable to check account security.');
      }
    })();
    return () => { disposed = true; };
  }, [userId, revision]);

  if (loading) return <main className="mx-auto max-w-md p-6"><p role="status">Checking account security…</p></main>;
  if (!user) return <>{children}</>;
  if (checkedUser === user.id && !factorId) return <>{children}</>;
  return <main className="mx-auto max-w-md p-6 space-y-4">
    <h1 className="text-xl font-semibold">Verify your account</h1>
    {error && <p role="alert">{error}</p>}
    {factorId ? <form className="space-y-4" onSubmit={async event => {
      event.preventDefault();
      if (submitting.current) return;
      submitting.current = true;
      setBusy(true);
      setError('');
      try {
        const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId, code: validateAuthenticatorCode(code),
        });
        if (verifyError) throw verifyError;
        setCode('');
        setRevision(value => value + 1);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Verification failed. Try a new code.');
      } finally { submitting.current = false; setBusy(false); }
    }}>
      <label htmlFor="mfa-code">Authenticator code</label>
      <Input id="mfa-code" value={code} onChange={event => setCode(event.target.value)}
        inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required disabled={busy} />
      <Button type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</Button>
    </form> : !error && <p role="status">Checking account security…</p>}
    {error && <Button disabled={busy} onClick={() => setRevision(value => value + 1)}>Retry security check</Button>}
    <Button disabled={busy} variant="outline" onClick={() => void signOut().catch(() => setError('Sign out failed. Please try again.'))}>Sign out</Button>
  </main>;
}
