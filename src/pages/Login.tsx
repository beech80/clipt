import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gamepad2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import GameBoyControls from "@/components/GameBoyControls";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      toast.success("Successfully logged in!");
      navigate("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign in");
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gameboy-header">
        <h1 className="gameboy-title">CLIP</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-gaming-400/20 flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-gaming-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-background border-gaming-400/30 focus:border-gaming-400"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-background border-gaming-400/30 focus:border-gaming-400"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gaming-400 hover:bg-gaming-500 text-white"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="mt-4 text-center space-y-2">
              <Link to="/reset-password" className="text-sm text-primary hover:underline block">
                Forgot your password?
              </Link>
              <Link to="/resend-verification" className="text-sm text-primary hover:underline block">
                Resend verification email
              </Link>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      <GameBoyControls />
    </div>
  );
};

export default Login;