import React from "react";
import { useNavigate } from "react-router-dom";
import { navigateToUserProfile } from "@/utils/navigation";

interface UserLinkProps {
  username: string;
  displayName?: string;
  className?: string;
  showAtSymbol?: boolean;
}

export const UserLink: React.FC<UserLinkProps> = ({
  username,
  displayName,
  className = "text-blue-500 hover:underline cursor-pointer",
  showAtSymbol = false
}) => {
  const navigate = useNavigate();
  
  if (!username) return null;
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigateToUserProfile(navigate, username);
  };
  
  return (
    <span 
      onClick={handleClick} 
      className={className}
      role="button"
      tabIndex={0}
    >
      {showAtSymbol ? "@" : ""}{displayName || username}
    </span>
  );
};
