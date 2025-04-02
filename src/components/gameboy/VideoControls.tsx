import React from 'react';

// Handle video controls from the GameBoy UI
export const handleVideoControl = (
  action: 'play' | 'pause' | 'forward' | 'backward',
  videoRef: React.RefObject<HTMLVideoElement>,
  seekAmount: number = 10
) => {
  if (!videoRef.current) return;
  
  const video = videoRef.current;
  
  switch (action) {
    case 'play':
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      break;
    case 'pause':
      video.pause();
      break;
    case 'forward':
      video.currentTime = Math.min(video.duration, video.currentTime + seekAmount);
      break;
    case 'backward':
      video.currentTime = Math.max(0, video.currentTime - seekAmount);
      break;
  }
};

// When user presses a button on the GameBoy controller, dispatch a custom event
export const dispatchVideoControl = (
  action: 'play' | 'pause' | 'forward' | 'backward',
  videoId?: string
) => {
  document.dispatchEvent(
    new CustomEvent('video-control', {
      detail: {
        action,
        videoId
      }
    })
  );
};

export default {
  handleVideoControl,
  dispatchVideoControl
};
