import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gamepad2 } from "lucide-react";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      navigate("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <main className="clipt-auth clipt-auth-form px-4 py-6">
      <div className="gaming-card mx-auto max-w-md space-y-6 p-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-gaming-400/20 flex items-center justify-center">
              <Gamepad2 className="h-6 w-6 text-gaming-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <Input
              type="email"
              aria-label="Email for password reset"
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
            {loading ? "Sending..." : "Send Reset Link"}
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

export default ResetPassword;
