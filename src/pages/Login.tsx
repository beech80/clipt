import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, UserPlus, Gamepad2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<'email' | 'password' | 'signin' | 'signup'>('email');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Check if user just signed up
  useEffect(() => {
    const signedUpFlag = localStorage.getItem('justSignedUp');
    if (signedUpFlag === 'true') {
      setJustSignedUp(true);
      // Remove the flag after showing the message
      localStorage.removeItem('justSignedUp');
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (currentSelection === 'password') setCurrentSelection('email');
          else if (currentSelection === 'signin') setCurrentSelection('password');
          else if (currentSelection === 'signup') setCurrentSelection('signin');
          break;
        case 'ArrowDown':
          if (currentSelection === 'email') setCurrentSelection('password');
          else if (currentSelection === 'password') setCurrentSelection('signin');
          else if (currentSelection === 'signin') setCurrentSelection('signup');
          break;
        case 'Enter':
          if (currentSelection === 'signin') handleLogin(new Event('submit') as any);
          else if (currentSelection === 'signup') navigate('/signup');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSelection]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1033] to-[#060818] text-white overflow-hidden">
      {/* Simplified header - just a back button and CLIPT title */}
      <div className="flex justify-between items-center p-4 bg-black/30 border-b border-blue-900/30">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-blue-400 hover:text-blue-300"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">Back</span>
          </button>
        </div>
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          CLIPT
        </div>
        <div className="w-20"></div> {/* Empty div for balanced spacing */}
      </div>

      <div className="container mx-auto flex flex-col items-center justify-center p-4 pt-12 pb-32">
        <div className="max-w-md w-full">
          {/* Enhanced login card with more futuristic gaming aesthetics */}
          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-800/50 rounded-xl shadow-2xl overflow-hidden">
            {/* Animated Header with particle effects */}
            <div className="bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-900/80 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-24 h-24 rounded-full bg-blue-500/10 animate-pulse filter blur-xl"></div>
                <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full bg-purple-500/10 animate-pulse filter blur-xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-indigo-500/10 animate-pulse filter blur-2xl"></div>
              </div>
              
              <div className="relative z-10 mb-3">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-25 blur-md animate-pulse"></div>
                    <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Gamepad2 className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                  SIGN IN
                </h1>
              </div>
            </div>

            {/* Form with enhanced styling */}
            <div className="p-8 relative space-y-6">
              {/* Background effects */}
              <div className="absolute -right-8 top-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-5 blur-xl"></div>
              <div className="absolute left-1/4 -top-8 w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 opacity-5 blur-xl"></div>
              
              {justSignedUp && (
                <Alert className="bg-blue-950/30 border-blue-800 text-blue-400 mb-4">
                  <AlertDescription>
                    We've sent a verification email to your address. Please verify your email before logging in.
                    <div className="mt-2">
                      <Button 
                        variant="link" 
                        className="text-blue-400 p-0 h-auto"
                        onClick={() => setJustSignedUp(false)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-900/40 border border-red-700/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div 
                  className={`${currentSelection === 'email' ? 'transform scale-102' : ''} transition-all duration-200`}
                  onClick={() => setCurrentSelection('email')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full ${currentSelection === 'email' ? 'bg-blue-400' : 'bg-blue-900'} mr-2`}></div>
                    <label className="text-sm font-medium text-blue-300">Email Address</label>
                  </div>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className={`bg-blue-950/50 border-blue-700/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white h-12 ${
                      currentSelection === 'email' ? 'border-blue-500 ring-2 ring-blue-500/30' : ''
                    }`}
                  />
                </div>
                
                <div 
                  className={`${currentSelection === 'password' ? 'transform scale-102' : ''} transition-all duration-200`}
                  onClick={() => setCurrentSelection('password')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full ${currentSelection === 'password' ? 'bg-blue-400' : 'bg-blue-900'} mr-2`}></div>
                    <label className="text-sm font-medium text-blue-300">Password</label>
                  </div>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={`bg-blue-950/50 border-blue-700/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white h-12 ${
                      currentSelection === 'password' ? 'border-blue-500 ring-2 ring-blue-500/30' : ''
                    }`}
                  />
                </div>
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full h-14 font-medium transition-all duration-200 ${
                      currentSelection === 'signin'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-blue-400 transform scale-102 shadow-lg shadow-blue-900/30'
                        : 'bg-blue-800/70 hover:bg-blue-700/70 border border-blue-700/50'
                    }`}
                    onClick={() => setCurrentSelection('signin')}
                  >
                    <LogIn className={`h-5 w-5 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
                
                <div 
                  className="flex justify-center pt-2"
                  onClick={() => setCurrentSelection('signup')}
                >
                  <Button
                    type="button"
                    variant="link"
                    className={`text-blue-400 hover:text-blue-300 ${
                      currentSelection === 'signup' ? 'underline text-blue-300' : ''
                    }`}
                    onClick={() => navigate('/signup')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create a new account
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="text-center mt-8 text-xs text-blue-500/60">
            CLIPT 2025 - Next-Gen Gaming Social Platform
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
