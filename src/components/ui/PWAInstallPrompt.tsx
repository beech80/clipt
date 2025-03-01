import { useState, useEffect } from 'react';
import { Button } from './button';
import { X } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setShowInstallPrompt(true);
    });

    // Handle the app installed event
    window.addEventListener('appinstalled', () => {
      // Log install to analytics
      console.log('PWA was installed');
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      // Hide the install button
      setShowInstallPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear the deferredPrompt variable after use
    setDeferredPrompt(null);
    // Hide the install UI
    setShowInstallPrompt(false);
  };

  const dismissPrompt = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex flex-col space-y-3 z-50">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Install Clipt App</h3>
        <button onClick={dismissPrompt} className="p-1 rounded-full hover:bg-primary/20">
          <X size={18} />
        </button>
      </div>
      <p className="text-sm opacity-90">
        Install Clipt on your device for a better experience, faster loading times, and offline access.
      </p>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={dismissPrompt}>
          Not now
        </Button>
        <Button size="sm" onClick={handleInstallClick}>
          Install
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
