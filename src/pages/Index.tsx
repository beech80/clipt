import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CreditCard } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Welcome to Our Platform</h1>
          <p className="text-xl mb-8">Join our community and get access to exclusive content</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/login')}
              size="lg"
              variant="default"
            >
              Get Started
            </Button>
            
            <Button 
              onClick={() => navigate('/subscription')}
              size="lg"
              variant="outline"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              View Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;