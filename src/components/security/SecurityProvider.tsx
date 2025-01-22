import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { securityService } from '@/services/securityService';
import { useToast } from '@/components/ui/use-toast';

interface SecurityContextType {
  validateInput: (input: string, maxLength?: number) => boolean;
  sanitizeInput: (input: string) => string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Apply security headers
    const headers = securityService.getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      if (document.head.querySelector(`meta[http-equiv="${key}"]`)) return;
      
      const meta = document.createElement('meta');
      meta.httpEquiv = key;
      meta.content = value;
      document.head.appendChild(meta);
    });

    // Log initial security event
    securityService.logSecurityEvent(
      'session_start',
      'low',
      user?.id,
      { userAgent: navigator.userAgent }
    );

    // Detect suspicious behavior
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        securityService.logSecurityEvent(
          'tab_hidden',
          'low',
          user?.id
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const validateInput = (input: string, maxLength?: number): boolean => {
    const isValid = securityService.validateInput(input, maxLength);
    if (!isValid) {
      toast({
        title: "Invalid Input",
        description: "The input contains potentially unsafe content.",
        variant: "destructive"
      });
    }
    return isValid;
  };

  const sanitizeInput = (input: string): string => {
    return securityService.sanitizeInput(input);
  };

  return (
    <SecurityContext.Provider value={{ validateInput, sanitizeInput }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}