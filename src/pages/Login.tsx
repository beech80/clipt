import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, LogIn } from "lucide-react";
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
    <div className="min-h-screen w-full bg-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-center bg-white border-b-2 border-[#9b87f5]">
        <h1 className="text-lg font-bold tracking-widest text-[#1A1F2C]">CLIP</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 mt-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg border-2 border-[#9b87f5] shadow-lg">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-[#1A1F2C]">Welcome Back</h1>
            <p className="text-[#9b87f5] text-lg">Sign in to your CLIP account</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#9b87f5]" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white border-2 border-[#9b87f5] text-[#1A1F2C] text-lg w-full focus:ring-2 focus:ring-[#9b87f5]"
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
                  className="pl-10 h-12 bg-white border-2 border-[#9b87f5] text-[#1A1F2C] text-lg w-full focus:ring-2 focus:ring-[#9b87f5]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium bg-[#9b87f5] text-white hover:bg-[#8B5CF6] transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in <LogIn className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <div className="mt-6 text-center space-y-3">
              <Link 
                to="/reset-password" 
                className="text-[#9b87f5] hover:text-[#8B5CF6] text-lg block transition-colors duration-200"
              >
                Forgot your password?
              </Link>
              <Link 
                to="/resend-verification" 
                className="text-[#9b87f5] hover:text-[#8B5CF6] text-lg block transition-colors duration-200"
              >
                Resend verification email
              </Link>
              <p className="text-[#1A1F2C] text-lg">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#9b87f5] hover:text-[#8B5CF6] transition-colors duration-200">
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