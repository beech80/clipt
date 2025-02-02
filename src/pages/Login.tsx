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

  console.log("Login component rendering"); // Debug log

  return (
    <div className="min-h-screen w-full bg-[#1A1F2C] flex flex-col">
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#9b87f5] border-b-4 border-[#7E69AB] shadow-lg z-50">
        <div className="h-full flex items-center justify-center">
          <h1 className="text-2xl font-bold tracking-widest text-[#1A1F2C]">CLIP</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 mt-16">
        <div className="w-full max-w-md bg-[#1A1F2C]/90 border-2 border-[#9b87f5] p-8 shadow-xl backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-lg bg-[#9b87f5]/20 flex items-center justify-center">
                <Gamepad2 className="h-8 w-8 text-[#9b87f5]" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white">Welcome Back</h1>
            <p className="text-[#9b87f5] text-lg">Sign in to your account</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-[#9b87f5]" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 bg-[#1A1F2C] border-2 border-[#9b87f5]/30 focus:border-[#9b87f5] text-white text-lg w-full"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-[#9b87f5]" />
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 h-12 bg-[#1A1F2C] border-2 border-[#9b87f5]/30 focus:border-[#9b87f5] text-white text-lg w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[#9b87f5] hover:bg-[#8B5CF6] text-white text-lg font-medium"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="mt-6 text-center space-y-3">
              <Link 
                to="/reset-password" 
                className="text-[#9b87f5] hover:text-[#8B5CF6] text-lg block"
              >
                Forgot your password?
              </Link>
              <Link 
                to="/resend-verification" 
                className="text-[#9b87f5] hover:text-[#8B5CF6] text-lg block"
              >
                Resend verification email
              </Link>
              <p className="text-gray-400 text-lg">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#9b87f5] hover:text-[#8B5CF6]">
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