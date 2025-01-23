import React, { createContext, useContext, useEffect, useRef } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/components/ui/use-toast";

interface AccessibilityState {
  highContrast: boolean;
  screenReaderEnabled: boolean;
  reducedMotion: boolean;
  captionSize: "small" | "medium" | "large";
  keyboardMode: boolean;
  focusRingColor: string;
  focusableElements: HTMLElement[];
  currentFocusIndex: number;
  setHighContrast: (value: boolean) => void;
  setScreenReaderEnabled: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setCaptionSize: (size: "small" | "medium" | "large") => void;
  setKeyboardMode: (value: boolean) => void;
  setFocusRingColor: (color: string) => void;
  moveFocus: (direction: "next" | "previous") => void;
  skipToContent: () => void;
  skipToNavigation: () => void;
}

const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useLocalStorage("highContrast", false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useLocalStorage("screenReader", false);
  const [reducedMotion, setReducedMotion] = useLocalStorage("reducedMotion", false);
  const [captionSize, setCaptionSize] = useLocalStorage<"small" | "medium" | "large">("captionSize", "medium");
  const [keyboardMode, setKeyboardMode] = useLocalStorage("keyboardMode", false);
  const [focusRingColor, setFocusRingColor] = useLocalStorage("focusRingColor", "#1a73e8");
  const focusableElements = useRef<HTMLElement[]>([]);
  const currentFocusIndex = useRef<number>(0);
  const { toast } = useToast();

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab key handling
      if (e.key === "Tab") {
        setKeyboardMode(true);
      }

      // Skip to content: Alt + 1
      if (e.altKey && e.key === "1") {
        skipToContent();
      }

      // Skip to navigation: Alt + 2
      if (e.altKey && e.key === "2") {
        skipToNavigation();
      }

      // Toggle high contrast: Alt + H
      if (e.altKey && e.key === "h") {
        setHighContrast(!highContrast);
        toast({
          title: `High Contrast ${!highContrast ? 'Enabled' : 'Disabled'}`,
          duration: 2000,
        });
      }

      // Toggle screen reader optimizations: Alt + S
      if (e.altKey && e.key === "s") {
        setScreenReaderEnabled(!screenReaderEnabled);
        toast({
          title: `Screen Reader Optimizations ${!screenReaderEnabled ? 'Enabled' : 'Disabled'}`,
          duration: 2000,
        });
      }

      // Move focus with arrow keys when in keyboard mode
      if (keyboardMode && e.altKey) {
        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            moveFocus("next");
            break;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            moveFocus("previous");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highContrast, screenReaderEnabled, keyboardMode]);

  // Enhanced focus management
  useEffect(() => {
    const updateFocusableElements = () => {
      focusableElements.current = Array.from(
        document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];
    };

    // Update focusable elements when DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(document.body, { childList: true, subtree: true });

    updateFocusableElements();
    return () => observer.disconnect();
  }, []);

  const moveFocus = (direction: "next" | "previous") => {
    if (focusableElements.current.length === 0) return;

    const increment = direction === "next" ? 1 : -1;
    currentFocusIndex.current = (currentFocusIndex.current + increment + focusableElements.current.length) % focusableElements.current.length;
    focusableElements.current[currentFocusIndex.current]?.focus();
  };

  const skipToContent = () => {
    const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
    if (mainContent) {
      mainContent.focus();
      mainContent.setAttribute('tabindex', '-1');
    }
  };

  const skipToNavigation = () => {
    const navigation = document.querySelector('nav') as HTMLElement;
    if (navigation) {
      navigation.focus();
      navigation.setAttribute('tabindex', '-1');
    }
  };

  // Enhanced screen reader support
  useEffect(() => {
    if (screenReaderEnabled) {
      document.documentElement.setAttribute('role', 'application');
      document.documentElement.setAttribute('aria-live', 'polite');
    } else {
      document.documentElement.removeAttribute('role');
      document.documentElement.removeAttribute('aria-live');
    }
  }, [screenReaderEnabled]);

  // Apply accessibility classes to document
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
    document.documentElement.classList.toggle("keyboard-mode", keyboardMode);
    document.documentElement.setAttribute("data-caption-size", captionSize);
    
    // Set CSS custom property for focus ring color
    document.documentElement.style.setProperty('--focus-ring-color', focusRingColor);
  }, [highContrast, reducedMotion, keyboardMode, captionSize, focusRingColor]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        screenReaderEnabled,
        reducedMotion,
        captionSize,
        keyboardMode,
        focusRingColor,
        focusableElements: focusableElements.current,
        currentFocusIndex: currentFocusIndex.current,
        setHighContrast,
        setScreenReaderEnabled,
        setReducedMotion,
        setCaptionSize,
        setKeyboardMode,
        setFocusRingColor,
        moveFocus,
        skipToContent,
        skipToNavigation,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}