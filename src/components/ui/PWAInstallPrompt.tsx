import { useState, useEffect } from 'react';
import { Button } from './button';
import { X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const beforeInstall = (e: Event) => {
      if (!('prompt' in e) || typeof e.prompt !== 'function' || !('userChoice' in e)) return;
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as InstallPromptEvent);
      // Update UI to show install button
      setShowInstallPrompt(true);
    };

    // Handle the app installed event
    const installed = () => {
      // Log install to analytics
      console.log('PWA was installed');
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      // Hide the install button
      setShowInstallPrompt(false);
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
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
        <button onClick={dismissPrompt} aria-label="Dismiss install prompt" className="p-1 rounded-full hover:bg-primary/20">
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
