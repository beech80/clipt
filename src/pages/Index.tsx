import { SEO } from "@/components/SEO";
import { MainNav } from "@/components/MainNav";
import PostList from "@/components/PostList";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { MainContent } from "@/components/home/MainContent";
import { SidebarContent } from "@/components/home/SidebarContent";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-[200px] w-full rounded-lg" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
      <div className="lg:col-span-1">
        <Skeleton className="h-[800px] w-full rounded-lg" />
      </div>
    </div>
  </div>
);

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const { reset } = useQueryErrorResetBoundary();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Clip - Share Your Gaming Moments",
    "description": "Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers.",
    "url": window.location.origin,
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-4 max-w-7xl" role="status" aria-label="Loading content">
        <LoadingSkeleton />
      </div>
    );
  }

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
                <ErrorBoundary
                  fallback={
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        There was an error loading the content. Please try again.
                      </AlertDescription>
                      <Button 
                        onClick={reset}
                        variant="outline"
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </Alert>
                  }
                >
                  <MainContent />
                </ErrorBoundary>
              </div>
              <div className="lg:col-span-1">
                <ErrorBoundary>
                  <SidebarContent />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}