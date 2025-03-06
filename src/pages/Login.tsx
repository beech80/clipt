import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, UserPlus, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

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
      toast.success("Successfully signed in!");
      navigate("/");
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to sign in. Please check your credentials and try again.";
      
      setError(errorMessage);
      console.error('Login error:', error);
      
      // More user-friendly error messages
      if (errorMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please check your credentials and try again.");
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("Please verify your email before logging in. Check your inbox for a verification email.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Demo account login for easy testing
  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn("demo@clipt.com", "demo123");
      toast.success("Signed in with demo account!");
      navigate("/");
    } catch (error) {
      setError("Could not sign in with demo account. Try using the regular login instead.");
      console.error('Demo login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f3c] to-[#0d0f1e] flex flex-col items-center justify-center pb-20">
      <div className="mx-auto max-w-md space-y-6 p-8 bg-[#0D1117] border border-indigo-500/20 rounded-xl shadow-xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg">
              <Gamepad2 className="h-14 w-14 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Welcome Back
          </h1>
          <p className="text-indigo-200/70">Sign in to your Clipt account</p>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-950/40 border border-red-500/50 text-red-200">
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
              disabled={loading}
              className="bg-[#161B22] border-indigo-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white h-12"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-[#161B22] border-indigo-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white h-12"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 font-medium"
            disabled={loading}
          >
            <LogIn className="mr-2 h-5 w-5" />
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-indigo-500/20"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0D1117] px-2 text-indigo-300/50">or</span>
            </div>
          </div>
          
          <Button
            type="button"
            className="w-full bg-[#161B22] border border-indigo-500/30 hover:bg-indigo-900/30 text-white h-12 font-medium"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            <Gamepad2 className="mr-2 h-5 w-5 text-indigo-400" />
            Try demo account
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full border border-indigo-500/30 hover:bg-indigo-900/30 text-white h-12 font-medium mt-2"
            onClick={() => navigate("/signup")}
            disabled={loading}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Create a new account
          </Button>

          <div className="mt-6 text-center space-y-2">
            <Link to="/reset-password" className="text-sm text-indigo-400 hover:text-indigo-300 block">
              Forgot your password?
            </Link>
            <Link to="/resend-verification" className="text-sm text-indigo-400 hover:text-indigo-300 block">
              Resend verification email
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
