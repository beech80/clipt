import React from 'react';

// Helper function to trigger post interactions from the GameBoy controls
export const triggerPostInteraction = (
  action: 'like' | 'comment' | 'trophy' | 'save',
  postId: string
) => {
  if (!postId) return;
  
  // Dispatch a custom event with the post ID and action
  const eventType = `${action}-button-click`;
  document.dispatchEvent(
    new CustomEvent(eventType, {
      detail: { postId }
    })
  );
  
  // Visual feedback (optional)
  const button = document.querySelector(`[data-post-id="${postId}"] .${action}-button`);
  if (button) {
    button.classList.add('pulse-animation');
    setTimeout(() => {
      button.classList.remove('pulse-animation');
    }, 300);
  }
};

export default {
  triggerPostInteraction
};
