import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

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
          {/* Console signup screen - Xbox/PS5 hybrid style */}
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl shadow-xl overflow-hidden">
            {/* Header with glowing effect */}
            <div className="bg-gradient-to-r from-purple-900/80 via-blue-900/80 to-purple-900/80 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-purple-500/10 filter blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <Gamepad2 className="h-16 w-16 mx-auto text-purple-300 mb-3" />
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-purple-300">
                  Create Account
                </h1>
                <p className="text-purple-200/70 mt-2">Join the gaming community</p>
              </div>
            </div>

            {/* Form with console styling */}
            <div className="p-6 relative">
              {/* Nintendo DS-style floating bubbles */}
              <div className="absolute -right-4 top-1/4 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-50"></div>
              <div className="absolute left-1/4 -top-4 w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30"></div>
              
              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-900/40 border border-red-700/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
                <div 
                  className={`${currentSelection === 'email' ? 'transform scale-105 -translate-x-1' : ''} transition-all duration-200`}
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
                      currentSelection === 'email' ? 'border-purple-500' : ''
                    }`}
                  />
                </div>
                
                <div 
                  className={`${currentSelection === 'username' ? 'transform scale-105 -translate-x-1' : ''} transition-all duration-200`}
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
                      currentSelection === 'username' ? 'border-purple-500' : ''
                    }`}
                  />
                </div>
                
                <div 
                  className={`${currentSelection === 'password' ? 'transform scale-105 -translate-x-1' : ''} transition-all duration-200`}
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
                      currentSelection === 'password' ? 'border-purple-500' : ''
                    }`}
                  />
                </div>
                
                <div className="pt-3">
                  <Button
                    type="submit"
                    className={`w-full h-12 font-medium transition-all duration-200 ${
                      currentSelection === 'signup'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-2 border-purple-400 transform scale-105'
                        : 'bg-purple-800/70 hover:bg-purple-700/70 border border-purple-700/50'
                    }`}
                    disabled={loading}
                    onClick={() => setCurrentSelection('signup')}
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-grow border-t border-purple-800"></div>
                  <div className="px-3 text-sm text-purple-400">or</div>
                  <div className="flex-grow border-t border-purple-800"></div>
                </div>
                
                <Button
                  type="button"
                  className={`w-full h-12 font-medium transition-all duration-200 ${
                    currentSelection === 'login'
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-700 border-2 border-blue-400 transform scale-105'
                      : 'bg-blue-900/50 hover:bg-blue-800/50 border border-blue-700/50'
                  }`}
                  onClick={() => {
                    setCurrentSelection('login');
                    navigate('/login');
                  }}
                  disabled={loading}
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Back to login
                </Button>

                <div className="pt-3 text-center">
                  <p className="text-sm text-purple-300/70">
                    By creating an account, you agree to our
                    <br />
                    <Link to="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</Link>
                    {" & "}
                    <Link to="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
          
          {/* Controller guide */}
          <div className="mt-6 text-center px-3 py-2 bg-blue-900/20 border border-blue-800/30 rounded-lg">
            <p className="text-sm text-purple-300">
              <span className="inline-block h-5 w-5 rounded-full bg-red-700 text-xs font-bold mr-1 flex items-center justify-center">A</span>
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
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900/80 to-blue-900/80 border border-purple-500/50 shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
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

export default Signup;
