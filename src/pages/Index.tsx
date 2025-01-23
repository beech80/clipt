import { SEO } from "@/components/SEO";
import { MainNav } from "@/components/MainNav";
import PostList from "@/components/PostList";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { MainContent } from "@/components/home/MainContent";
import { SidebarContent } from "@/components/home/SidebarContent";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Index() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Clip - Share Your Gaming Moments",
    "description": "Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers.",
    "url": window.location.origin,
  };

  return (
    <>
      <SEO 
        title="Clip - Share Your Gaming Moments"
        description="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers."
        type="website"
        structuredData={structuredData}
        route="/"
      />

      <main 
        role="main"
        aria-label="Home page content"
        className="min-h-screen bg-gradient-to-b from-gaming-900 to-gaming-800"
      >
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <MainNav className="mb-6" />
          
          <div className={`mt-8 ${isMobile ? 'space-y-6' : 'space-y-8'}`}>
            {!user && <WelcomeSection />}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
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
    </>
  );
}