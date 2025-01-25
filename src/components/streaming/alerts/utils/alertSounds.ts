export const playAlertSound = (volume: number = 0.5) => {
  const audio = new Audio('/sounds/alert.mp3');
  audio.volume = Math.min(Math.max(volume, 0), 1); // Clamp between 0 and 1
  return audio.play().catch((error) => {
    console.error('Error playing alert sound:', error);
  });
};