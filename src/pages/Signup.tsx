import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, ChevronLeft, Gamepad2, LogIn } from "lucide-react";
import { toast } from "sonner";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSelection, setCurrentSelection] = useState<'email' | 'username' | 'password' | 'signup' | 'login'>('email');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (currentSelection === 'username') setCurrentSelection('email');
          else if (currentSelection === 'password') setCurrentSelection('username');
          else if (currentSelection === 'signup') setCurrentSelection('password');
          else if (currentSelection === 'login') setCurrentSelection('signup');
          break;
        case 'ArrowDown':
          if (currentSelection === 'email') setCurrentSelection('username');
          else if (currentSelection === 'username') setCurrentSelection('password');
          else if (currentSelection === 'password') setCurrentSelection('signup');
          else if (currentSelection === 'signup') setCurrentSelection('login');
          break;
        case 'Enter':
          if (currentSelection === 'signup') handleSignup(new Event('submit') as any);
          else if (currentSelection === 'login') navigate('/login');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSelection]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, username);
      toast.success("Account created! Please check your email to verify your account.");
      navigate("/login");
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to create an account. Please try again.";
      
      setError(errorMessage);
      console.error('Signup error:', error);
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
          {/* Enhanced signup card with more futuristic gaming aesthetics */}
          <div className="bg-purple-900/20 backdrop-blur-sm border border-purple-800/50 rounded-xl shadow-2xl overflow-hidden">
            {/* Animated Header with particle effects */}
            <div className="bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-blue-900/80 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-24 h-24 rounded-full bg-purple-500/10 animate-pulse filter blur-xl"></div>
                <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full bg-blue-500/10 animate-pulse filter blur-xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-indigo-500/10 animate-pulse filter blur-2xl"></div>
              </div>
              
              <div className="relative z-10 mb-3">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-25 blur-md animate-pulse"></div>
                    <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <Gamepad2 className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
                  SIGN UP
                </h1>
              </div>
            </div>

            {/* Form with enhanced styling */}
            <div className="p-8 relative space-y-6">
              {/* Background effects */}
              <div className="absolute -right-8 top-1/4 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-5 blur-xl"></div>
              <div className="absolute left-1/4 -top-8 w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-5 blur-xl"></div>
              
              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-900/40 border border-red-700/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignup} className="space-y-6">
                <div 
                  className={`${currentSelection === 'email' ? 'transform scale-102' : ''} transition-all duration-200`}
                  onClick={() => setCurrentSelection('email')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full ${currentSelection === 'email' ? 'bg-purple-400' : 'bg-purple-900'} mr-2`}></div>
                    <label className="text-sm font-medium text-purple-300">Email Address</label>
                  </div>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className={`bg-blue-950/50 border-purple-700/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white h-12 ${
                      currentSelection === 'email' ? 'border-purple-500 ring-2 ring-purple-500/30' : ''
                    }`}
                  />
                </div>
                
                <div 
                  className={`${currentSelection === 'username' ? 'transform scale-102' : ''} transition-all duration-200`}
                  onClick={() => setCurrentSelection('username')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full ${currentSelection === 'username' ? 'bg-purple-400' : 'bg-purple-900'} mr-2`}></div>
                    <label className="text-sm font-medium text-purple-300">Username</label>
                  </div>
                  <Input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className={`bg-blue-950/50 border-purple-700/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white h-12 ${
                      currentSelection === 'username' ? 'border-purple-500 ring-2 ring-purple-500/30' : ''
                    }`}
                  />
                </div>
                
                <div 
                  className={`${currentSelection === 'password' ? 'transform scale-102' : ''} transition-all duration-200`}
                  onClick={() => setCurrentSelection('password')}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full ${currentSelection === 'password' ? 'bg-purple-400' : 'bg-purple-900'} mr-2`}></div>
                    <label className="text-sm font-medium text-purple-300">Password</label>
                  </div>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={`bg-blue-950/50 border-purple-700/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white h-12 ${
                      currentSelection === 'password' ? 'border-purple-500 ring-2 ring-purple-500/30' : ''
                    }`}
                  />
                </div>
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full h-14 font-medium transition-all duration-200 ${
                      currentSelection === 'signup'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-2 border-purple-400 transform scale-102 shadow-lg shadow-purple-900/30'
                        : 'bg-purple-800/70 hover:bg-purple-700/70 border border-purple-700/50'
                    }`}
                    onClick={() => setCurrentSelection('signup')}
                  >
                    <UserPlus className={`h-5 w-5 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
                
                <div 
                  className="flex justify-center pt-2"
                  onClick={() => setCurrentSelection('login')}
                >
                  <Button
                    type="button"
                    variant="link"
                    className={`text-purple-400 hover:text-purple-300 ${
                      currentSelection === 'login' ? 'underline text-purple-300' : ''
                    }`}
                    onClick={() => navigate('/login')}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Already have an account? Sign in
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="text-center mt-8 text-xs text-purple-500/60">
            CLIPT 2025 - Next-Gen Gaming Social Platform
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
