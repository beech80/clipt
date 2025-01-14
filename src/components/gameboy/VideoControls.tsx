import { toast } from 'sonner';

export const handleVideoControl = (direction: string) => {
  const video = document.querySelector('video');
  if (!video) return;

  switch (direction) {
    case 'up':
      // Previous video logic
      toast.info('Previous video');
      break;
    case 'down':
      // Next video logic
      toast.info('Next video');
      break;
    case 'left':
      // Rewind 10 seconds
      video.currentTime = Math.max(0, video.currentTime - 10);
      toast.info('Rewinding 10s');
      break;
    case 'right':
      // Fast forward 10 seconds
      video.currentTime = Math.min(video.duration, video.currentTime + 10);
      toast.info('Fast forwarding 10s');
      break;
    default:
      break;
  }
};