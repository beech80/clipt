import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useIsMobile } from "@/hooks/use-mobile";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import PostList from "@/components/PostList";
import { SeasonBanner } from "@/components/seasons/SeasonBanner";
import { ContentFilters } from "@/components/home/ContentFilters";
import { OnboardingSection } from "@/components/home/OnboardingSection";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { MainContent } from "@/components/home/MainContent";
import { SidebarContent } from "@/components/home/SidebarContent";
import { toast } from "@/hooks/use-toast";

export default function Index() {
  const { user } = useAuth();
  const { isCompleted } = useOnboarding();
  const isMobile = useIsMobile();
  const [contentFilter, setContentFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      onSuccess: () => {
        toast({
          title: "Profile loaded",
          description: "Your profile data has been loaded successfully.",
        });
      },
    },
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            There was an error loading your profile. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Clip - Share Your Gaming Moments",
    "description": "Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers.",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
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
        <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-4 md:py-8 space-y-4 md:space-y-8`}>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ContentFilters
                contentFilter={contentFilter}
                setContentFilter={setContentFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />

              {user && !isCompleted && (
                <OnboardingSection show={true} />
              )}

              <SeasonBanner />
              
              {user ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                  <MainContent />
                  <SidebarContent />
                </div>
              ) : (
                <div className="space-y-8" role="region" aria-label="Welcome section">
                  <WelcomeSection />
                  <section 
                    aria-label="Latest posts"
                    tabIndex={0}
                    className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-4 md:p-6"
                  >
                    <PostList />
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}