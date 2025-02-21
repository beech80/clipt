
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, UserPlus } from "lucide-react";
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
    <div className="pb-[180px] sm:pb-[200px]">
      <div className="mx-auto max-w-md space-y-6 pt-12">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/2d36b6eb-8ffa-4d34-a6b1-c3beb67e019f.png" 
              alt="Gaming Camera Logo" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/signup")}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create an account
          </Button>

          <div className="mt-4 text-center space-y-2">
            <Link to="/reset-password" className="text-sm text-primary hover:underline block">
              Forgot your password?
            </Link>
            <Link to="/resend-verification" className="text-sm text-primary hover:underline block">
              Resend verification email
            </Link>
          </div>
        </form>
      </div>
      <GameBoyControls />
    </div>
  );
};

export default Login;
