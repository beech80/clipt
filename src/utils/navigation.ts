import { NavigateFunction } from "react-router-dom";

/**
 * Navigate to a user's profile page when their username is clicked
 * This centralizes all username navigation to ensure consistent behavior
 */
export const navigateToUserProfile = (navigate: NavigateFunction, username: string) => {
  if (!username) return;
  navigate(`/profile/${username}`);
};
