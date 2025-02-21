
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resendVerificationEmail } = useAuth();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resendVerificationEmail(email);
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-[180px] sm:pb-[200px]">
      <div className="mx-auto max-w-md space-y-6 pt-12">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-gaming-400/20 flex items-center justify-center">
              <Mail className="h-6 w-6 text-gaming-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Resend Verification</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a new verification link
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>
              Verification email has been resent. Please check your inbox.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Resend Verification Email"}
          </Button>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already verified?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
      <GameBoyControls />
    </div>
  );
};

export default ResendVerification;
