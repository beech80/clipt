import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, UserPlus, Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<'email' | 'password' | 'signin' | 'demo' | 'signup'>('email');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

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
          else if (currentSelection === 'demo') setCurrentSelection('signin');
          else if (currentSelection === 'signup') setCurrentSelection('demo');
          break;
        case 'ArrowDown':
          if (currentSelection === 'email') setCurrentSelection('password');
          else if (currentSelection === 'password') setCurrentSelection('signin');
          else if (currentSelection === 'signin') setCurrentSelection('demo');
          else if (currentSelection === 'demo') setCurrentSelection('signup');
          break;
        case 'Enter':
          if (currentSelection === 'signin') handleLogin(new Event('submit') as any);
          else if (currentSelection === 'demo') handleDemoLogin();
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
    <div className="min-h-screen bg-gradient-to-b from-[#0D1033] to-[#060818] text-white overflow-hidden">
      {/* Top status bar - PlayStation style */}
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
        <div className="text-sm font-medium">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <div className="w-3 h-3 rounded-full bg-white"></div>
        </div>
      </div>

      <div className="container mx-auto flex flex-col items-center justify-center p-4 pt-16 pb-32">
        <div className="max-w-md w-full">
          {/* Console login screen - Xbox/PS5 hybrid style */}
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl shadow-xl overflow-hidden">
            {/* Header with glowing effect */}
            <div className="bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-blue-900/80 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-blue-500/10 filter blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <Gamepad2 className="h-16 w-16 mx-auto text-blue-300 mb-3" />
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300">
                  Sign In
                </h1>
                <p className="text-blue-200/70 mt-2">Enter your credentials to continue</p>
              </div>
            </div>

            {/* Form with console styling */}
            <div className="p-6 relative">
              {/* Nintendo DS-style floating bubbles */}
              <div className="absolute -right-4 top-1/4 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-50"></div>
              <div className="absolute left-1/4 -top-4 w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500 opacity-30"></div>
              
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

              <form onSubmit={handleLogin} className="space-y-5">
                <div 
                  className={`${currentSelection === 'email' ? 'transform scale-105 -translate-x-1' : ''} transition-all duration-200`}
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
                      currentSelection === 'email' ? 'border-blue-500' : ''
                    }`}
                  />
                </div>
                
                <div 
                  className={`${currentSelection === 'password' ? 'transform scale-105 -translate-x-1' : ''} transition-all duration-200`}
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
                      currentSelection === 'password' ? 'border-blue-500' : ''
                    }`}
                  />
                </div>
                
                <div className="pt-3">
                  <Button
                    type="submit"
                    className={`w-full h-12 font-medium transition-all duration-200 ${
                      currentSelection === 'signin'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-blue-400 transform scale-105'
                        : 'bg-blue-800/70 hover:bg-blue-700/70 border border-blue-700/50'
                    }`}
                    disabled={loading}
                    onClick={() => setCurrentSelection('signin')}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-grow border-t border-blue-800"></div>
                  <div className="px-3 text-sm text-blue-400">or</div>
                  <div className="flex-grow border-t border-blue-800"></div>
                </div>
                
                <Button
                  type="button"
                  className={`w-full h-12 font-medium transition-all duration-200 ${
                    currentSelection === 'demo'
                      ? 'bg-gradient-to-r from-green-700 to-blue-700 border-2 border-green-400 transform scale-105'
                      : 'bg-blue-900/50 hover:bg-blue-800/50 border border-blue-700/50'
                  }`}
                  onClick={() => {
                    setCurrentSelection('demo');
                    handleDemoLogin();
                  }}
                  disabled={loading}
                >
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  Try demo account
                </Button>
                
                <Button
                  type="button"
                  className={`w-full h-12 font-medium transition-all duration-200 ${
                    currentSelection === 'signup'
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-700 border-2 border-purple-400 transform scale-105'
                      : 'bg-blue-900/50 hover:bg-blue-800/50 border border-blue-700/50'
                  }`}
                  onClick={() => {
                    setCurrentSelection('signup');
                    navigate('/signup');
                  }}
                  disabled={loading}
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create a new account
                </Button>

                <div className="flex justify-between text-sm pt-3">
                  <Link to="/reset-password" className="text-blue-400 hover:text-blue-300 flex items-center">
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Forgot password
                  </Link>
                  <Link to="/resend-verification" className="text-blue-400 hover:text-blue-300 flex items-center">
                    Resend verification
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </form>
            </div>
          </div>
          
          {/* Controller guide */}
          <div className="mt-6 text-center px-3 py-2 bg-blue-900/20 border border-blue-800/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <span className="inline-block h-5 w-5 rounded-full bg-blue-700 text-xs font-bold mr-1 flex items-center justify-center">A</span>
              Select &nbsp;
              <span className="inline-block h-5 w-5 rounded-full bg-yellow-700 text-xs font-bold mx-1 flex items-center justify-center">Y</span>
              Switch Input &nbsp;
              <span className="inline-block h-5 w-5 rounded-full bg-green-700 text-xs font-bold mx-1 flex items-center justify-center">B</span>
              Back
            </p>
          </div>
        </div>
      </div>
      
      {/* Game Controls - Bottom Nintendo/Xbox style */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/50 border-t border-blue-900/30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* D-Pad */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900/80 to-purple-900/80 border border-blue-500/50 shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-xs bg-black/50 px-2 py-1 rounded">↑</div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/3 text-xs bg-black/50 px-2 py-1 rounded">↓</div>
          </div>
          
          {/* Action Buttons */}
          <div className="relative w-20 h-20">
            <div className="absolute top-1/4 right-1/4 w-8 h-8 rounded-full bg-blue-700 border border-blue-400 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">X</span>
            </div>
            <div className="absolute bottom-1/4 right-1/4 w-8 h-8 rounded-full bg-red-700 border border-red-400 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">A</span>
            </div>
            <div className="absolute bottom-1/4 left-1/4 w-8 h-8 rounded-full bg-yellow-700 border border-yellow-400 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">Y</span>
            </div>
            <div className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-green-700 border border-green-400 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">B</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
