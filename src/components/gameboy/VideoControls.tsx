
import { toast } from 'sonner';

export const handleVideoControl = (direction: string) => {
  // Check if we're on a page with video first
  const video = document.querySelector('video');
  
  switch (direction) {
    case 'up':
      // Scroll up
      window.scrollBy({
        top: -300,
        behavior: 'smooth'
      });
      toast.info('Scrolling Up');
      break;
    case 'down':
      // Scroll down
      window.scrollBy({
        top: 300,
        behavior: 'smooth'
      });
      toast.info('Scrolling Down');
      break;
    case 'left':
      // Only control video if it exists
      if (video) {
        video.currentTime = Math.max(0, video.currentTime - 5);
        toast.info('Rewinding 5s');
      }
      break;
    case 'right':
      // Only control video if it exists
      if (video) {
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        toast.info('Fast forwarding 5s');
      }
      break;
    default:
      break;
  }
};

