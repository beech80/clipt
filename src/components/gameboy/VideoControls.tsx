
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
      // Rewind 5 seconds
      if (video) {
        video.currentTime = Math.max(0, video.currentTime - 5);
        toast.info('Rewinding 5s');
      }
      break;
    case 'right':
      // Fast forward 5 seconds
      if (video) {
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        toast.info('Fast forwarding 5s');
      }
      break;
    default:
      break;
  }
};
