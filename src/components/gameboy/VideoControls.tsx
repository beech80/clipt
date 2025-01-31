import { toast } from 'sonner';

export const handleVideoControl = (direction: string) => {
  const video = document.querySelector('video');
  
  switch (direction) {
    case 'up':
      // Scroll up
      const container = document.querySelector('.post-container');
      if (container) {
        container.scrollBy({
          top: -(window.innerHeight - 200),
          behavior: 'smooth'
        });
      }
      break;
    case 'down':
      // Scroll down
      const containerDown = document.querySelector('.post-container');
      if (containerDown) {
        containerDown.scrollBy({
          top: window.innerHeight - 200,
          behavior: 'smooth'
        });
      }
      break;
    case 'left':
      // Rewind 10 seconds
      if (video) {
        video.currentTime = Math.max(0, video.currentTime - 10);
        toast.info('Rewinding 10s');
      }
      break;
    case 'right':
      // Fast forward 10 seconds
      if (video) {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        toast.info('Fast forwarding 10s');
      }
      break;
    default:
      break;
  }
};