import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gamepad2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, { username });
      toast.success("Please check your email to verify your account!");
      navigate("/login");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign up";
      setError(errorMessage);
      
      // Provide more user-friendly error messages
      if (errorMessage.includes("email already exists")) {
        setError("This email is already registered. Try logging in instead.");
      }
      
      toast.error(errorMessage);
      console.error("Signup error:", error);
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
              <UserPlus className="h-14 w-14 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Create Account
          </h1>
          <p className="text-indigo-200/70">Join the gaming community</p>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-950/40 border border-red-500/50 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
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
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="bg-[#161B22] border-indigo-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white h-12"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="bg-[#161B22] border-indigo-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white h-12"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 font-medium"
            disabled={loading}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            {loading ? "Creating account..." : "Create account"}
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-indigo-200/70">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
