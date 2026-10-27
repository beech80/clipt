import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail } from 'lucide-react';
import { toast } from "sonner";

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const submitting = useRef(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);

    try {
      await resendVerificationEmail(email);
      toast.success('Verification request accepted. Check your inbox for the confirmation link.');
      navigate('/login');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <main className="clipt-auth-form px-4 py-8">
      <div className="gaming-card mx-auto max-w-md space-y-6 p-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Resend Verification Email</h1>
          <p className="text-muted-foreground">Enter your email to receive a new verification link</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <label htmlFor="verification-email" className="block mb-2">Email address</label>
            <Input
              id="verification-email"
              type="email"
              autoComplete="email"
              disabled={loading}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Resend Verification Email"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
        </form>
      </div>
    </main>
  );
};

export default ResendVerification;
