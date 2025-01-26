import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MainContent } from '@/components/home/MainContent';
import { SidebarContent } from '@/components/home/SidebarContent';
import { WelcomeSection } from '@/components/home/WelcomeSection';
import { OnboardingSection } from '@/components/home/OnboardingSection';
import { supabase } from '@/lib/supabase';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check onboarding status
    const checkOnboardingStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      
      setShowOnboarding(!profile?.onboarding_completed);
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <WelcomeSection />
          <OnboardingSection show={showOnboarding} />
          <MainContent />
        </div>
        <div className="lg:col-span-4">
          <SidebarContent />
        </div>
      </div>
    </div>
  );
};

export default Home;