import { SEO } from "@/components/SEO";
import { MainNav } from "@/components/MainNav";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { MainContent } from "@/components/home/MainContent";
import { SidebarContent } from "@/components/home/SidebarContent";
import { OBSSetupGuide } from "@/components/streaming/setup/OBSSetupGuide";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { useEffect } from 'react';
import LoggingService from '@/services/loggingService';

export default function Index() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  usePerformanceMonitoring('HomePage');

  useEffect(() => {
    const pageLoadStart = performance.now();
    
    return () => {
      const mountDuration = performance.now() - pageLoadStart;
      LoggingService.trackMetric('home_page_mount_duration', mountDuration, {
        component: 'HomePage'
      });
    };
  }, []);

  useEffect(() => {
    const trackInteraction = (e: MouseEvent | KeyboardEvent) => {
      LoggingService.trackMetric('home_page_interaction', 1, {
        component: 'HomePage',
        type: e.type,
        target: (e.target as HTMLElement)?.tagName?.toLowerCase()
      });
    };

    document.addEventListener('click', trackInteraction);
    document.addEventListener('keypress', trackInteraction);

    return () => {
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('keypress', trackInteraction);
    };
  }, []);

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
        <div className="container mx-auto px-4 py-4">
          <MainNav />
          
          <div className={`mt-6 ${isMobile ? 'space-y-4' : 'space-y-8'}`}>
            {!user && <WelcomeSection />}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
              <div className="lg:col-span-2">
                <MainContent />
                <div className="mt-8">
                  <OBSSetupGuide />
                </div>
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