import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Short delay for nice transition
    const timer = setTimeout(() => {
      navigate('/login');
    }, 100);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#020617] p-4">
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-sm border border-indigo-500/20 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Gamepad2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Welcome to Clipt</CardTitle>
          <CardDescription className="text-gray-400">
            The gaming community for sharing and discovering gameplay moments
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button 
            onClick={() => navigate('/login')}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Sign In
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/signup')}
            className="w-full border-green-600 text-green-500 hover:bg-green-600/10"
          >
            Create Account
          </Button>
        </CardContent>
        <CardFooter className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
