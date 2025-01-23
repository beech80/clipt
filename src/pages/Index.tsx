import { SEO } from "@/components/SEO";
import { MainNav } from "@/components/MainNav";
import { MainContent } from "@/components/home/MainContent";
import { SidebarContent } from "@/components/home/SidebarContent";
import { WelcomeSection } from "@/components/home/WelcomeSection";
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

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <MainNav />
          
          <div className={`mt-6 ${isMobile ? 'space-y-4' : 'space-y-8'}`}>
            {!user && <WelcomeSection />}
            
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
      </div>
    </>
  );
}