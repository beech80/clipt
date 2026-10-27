import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UpdatePassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const submitting = useRef(false);
  if (loading) return <p role="status">Checking recovery session…</p>;
  if (!user) return <main className="max-w-md mx-auto p-6"><h1>Password reset link expired</h1><Link to="/reset-password">Request a new reset link</Link></main>;
  return <main className="clipt-auth-form gaming-card max-w-md mx-auto p-6 space-y-4">
    <h1 className="text-2xl font-bold">Choose a new password</h1>
    {error && <p role="alert">{error}</p>}
    {complete ? <p role="status">Password updated. <Link to="/login">Return to login</Link></p> : (
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault();
        if (submitting.current) return;
        if (password !== confirmation) { setError('Passwords do not match.'); return; }
        setBusy(true);
        submitting.current = true;
        setError('');
        try {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          setComplete(true);
          setPassword('');
          setConfirmation('');
          const result = await supabase.auth.signOut();
          if (!result.error) navigate('/login', { replace: true });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Password update failed. Please try again.');
        } finally { submitting.current = false; setBusy(false); }
      }}>
        <label className="block">New password<Input disabled={busy} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label className="block">Confirm new password<Input disabled={busy} type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
        <Button disabled={busy} type="submit">{busy ? 'Updating…' : 'Update password'}</Button>
      </form>
    )}
  </main>;
}
