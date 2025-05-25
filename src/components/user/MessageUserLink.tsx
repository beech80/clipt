import React from "react";
import { useNavigate } from "react-router-dom";

interface MessageUserLinkProps {
  username: string;
  displayName?: string;
  className?: string;
  userId: string;
  onUserClick: (userId: string) => void;
}

/**
 * A specialized version of UserLink for the messaging interface
 * Instead of navigating to the user's profile, it will open a chat with them
 */
export const MessageUserLink: React.FC<MessageUserLinkProps> = ({
  username,
  displayName,
  className = "text-blue-500 hover:underline cursor-pointer",
  userId,
  onUserClick
}) => {
  if (!username) return null;
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUserClick(userId);
  };
  
  return (
    <span 
      onClick={handleClick} 
      className={className}
      role="button"
      tabIndex={0}
    >
      {displayName || username}
    </span>
  );
};
