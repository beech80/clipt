import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import UserTitle from './UserTitle';
import { Link } from 'react-router-dom';
import type { Profile } from '@/types/profile';

interface UserWithTitleProps {
  userId: string;
  username?: string;
  displayName?: string;
  verified?: boolean;
  showTitle?: boolean;
  titleSize?: 'small' | 'medium' | 'large';
  asLink?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const UserWithTitle: React.FC<UserWithTitleProps> = ({
  userId,
  username: initialUsername,
  displayName: initialDisplayName,
  verified = false,
  showTitle = true,
  titleSize = 'small',
  asLink = true,
  className = '',
  style = {},
}) => {
  // If we don't have a username already, fetch the user profile
  const { data: profile } = useQuery<Profile>({
    queryKey: ['user-profile-minimal', userId],
    queryFn: async () => {
      if (initialUsername && initialDisplayName) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, selected_title, verified')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data as unknown as Profile;
    },
    enabled: !initialUsername || !initialDisplayName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const username = initialUsername || profile?.username || 'user';
  const displayName = initialDisplayName || profile?.display_name || username;
  const isVerified = verified || profile?.verified || false;
  const selectedTitle = profile?.selected_title;
  
  const content = (
    <>
      <span className="username-text">{displayName}</span>
      {isVerified && <span className="verified-badge ml-1">✓</span>}
      {showTitle && selectedTitle && (
        <UserTitle titleId={selectedTitle} size={titleSize} showText={false} />
      )}
    </>
  );
  
  if (asLink) {
    return (
      <Link 
        to={`/user/${username}`} 
        className={`user-with-title ${className}`} 
        style={style}
      >
        {content}
      </Link>
    );
  }
  
  return (
    <span className={`user-with-title ${className}`} style={style}>
      {content}
    </span>
  );
};

export default UserWithTitle;
