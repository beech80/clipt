
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ModerationQueue } from '@/components/moderation/ModerationQueue';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const Moderation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_moderator')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!profile?.is_moderator) {
    navigate('/');
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <ModerationQueue />
    </div>
  );
};

export default Moderation;
