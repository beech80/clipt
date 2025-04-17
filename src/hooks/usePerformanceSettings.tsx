import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Local storage keys for performance settings
const LS_HW_ACCELERATION = 'hardware-acceleration';
const LS_REDUCE_ANIMATIONS = 'reduce-animations';
const LS_BACKGROUND_PROCESSING = 'background-processing';

export function usePerformanceSettings() {
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [backgroundProcessing, setBackgroundProcessing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadPerformanceSettings = () => {
      try {
        // First try to load from localStorage
        const savedHwAcceleration = localStorage.getItem(LS_HW_ACCELERATION);
        const savedReduceAnimations = localStorage.getItem(LS_REDUCE_ANIMATIONS);
        const savedBgProcessing = localStorage.getItem(LS_BACKGROUND_PROCESSING);
        
        // Set states with values from localStorage or defaults
        setHardwareAcceleration(savedHwAcceleration === 'disabled' ? false : true);
        setReduceAnimations(savedReduceAnimations === 'enabled' ? true : false);
        setBackgroundProcessing(savedBgProcessing === 'disabled' ? false : true);
        
        // Apply settings to document
        applyHardwareAcceleration(savedHwAcceleration !== 'disabled');
        applyReducedAnimations(savedReduceAnimations === 'enabled');
        applyBackgroundProcessing(savedBgProcessing !== 'disabled');
        
        // Get current user
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setUserId(data.user.id);
          }
        }).catch(err => {
          console.error('Error getting user:', err);
        });
      } catch (err) {
        console.error('Error loading performance settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPerformanceSettings();
  }, []);

  // Helper function to apply hardware acceleration
  const applyHardwareAcceleration = (enabled: boolean) => {
    if (enabled) {
      document.body.classList.add('hardware-accelerated');
    } else {
      document.body.classList.remove('hardware-accelerated');
    }
  };
  
  // Helper function to apply reduced animations
  const applyReducedAnimations = (enabled: boolean) => {
    if (enabled) {
      document.body.classList.add('reduce-animations');
    } else {
      document.body.classList.remove('reduce-animations');
    }
  };
  
  // Helper function to apply background processing
  const applyBackgroundProcessing = (enabled: boolean) => {
    if (enabled && 'serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.register('/background-worker.js').catch(err => {
          console.error('Background service worker registration failed:', err);
        });
      } catch (err) {
        console.error('Error registering service worker:', err);
      }
    } else if (!enabled && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          if (registration.scope.includes('background-worker')) {
            registration.unregister();
          }
        }
      }).catch(err => {
        console.error('Error unregistering service worker:', err);
      });
    }
  };

  const toggleHardwareAcceleration = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      
      // Update local state
      setHardwareAcceleration(enabled);
      
      // Apply hardware acceleration setting
      applyHardwareAcceleration(enabled);
      
      // Save to localStorage
      localStorage.setItem(LS_HW_ACCELERATION, enabled ? 'enabled' : 'disabled');
      
      toast.success(`Hardware acceleration ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (err) {
      console.error('Error toggling hardware acceleration:', err);
      toast.error('Failed to update hardware acceleration settings');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReduceAnimations = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      
      // Update local state
      setReduceAnimations(enabled);
      
      // Apply reduced animations setting
      applyReducedAnimations(enabled);
      
      // Save to localStorage
      localStorage.setItem(LS_REDUCE_ANIMATIONS, enabled ? 'enabled' : 'disabled');
      
      toast.success(`Animations ${enabled ? 'reduced' : 'enabled'}`);
      return true;
    } catch (err) {
      console.error('Error toggling reduce animations:', err);
      toast.error('Failed to update animation settings');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBackgroundProcessing = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      
      // Update local state
      setBackgroundProcessing(enabled);
      
      // Apply background processing setting
      applyBackgroundProcessing(enabled);
      
      // Save to localStorage
      localStorage.setItem(LS_BACKGROUND_PROCESSING, enabled ? 'enabled' : 'disabled');
      
      toast.success(`Background processing ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (err) {
      console.error('Error toggling background processing:', err);
      toast.error('Failed to update background processing settings');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hardwareAcceleration,
    reduceAnimations,
    backgroundProcessing,
    isLoading,
    toggleHardwareAcceleration,
    toggleReduceAnimations,
    toggleBackgroundProcessing
  };
}
