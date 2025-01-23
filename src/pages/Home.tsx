import { MainNav } from "@/components/MainNav";
import { MainContent } from "@/components/home/MainContent";
import { SidebarContent } from "@/components/home/SidebarContent";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Home = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <main 
      role="main"
      aria-label="Home page content"
      className="min-h-screen bg-gradient-to-b from-gaming-900 to-gaming-800"
    >
      <div className="container mx-auto px-4 py-4">
        <MainNav />
        
        <div className={`mt-6 ${isMobile ? 'space-y-4' : 'space-y-8'}`}>          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-2">
              <MainContent />
            </div>
            <div className="lg:col-span-1">
              <SidebarContent />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;