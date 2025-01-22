import React, { createContext, useContext, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface AccessibilityState {
  highContrast: boolean;
  screenReaderEnabled: boolean;
  reducedMotion: boolean;
  captionSize: "small" | "medium" | "large";
  keyboardMode: boolean;
  focusRingColor: string;
  setHighContrast: (value: boolean) => void;
  setScreenReaderEnabled: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setCaptionSize: (size: "small" | "medium" | "large") => void;
  setKeyboardMode: (value: boolean) => void;
  setFocusRingColor: (color: string) => void;
}

const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useLocalStorage("highContrast", false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useLocalStorage("screenReader", false);
  const [reducedMotion, setReducedMotion] = useLocalStorage("reducedMotion", false);
  const [captionSize, setCaptionSize] = useLocalStorage<"small" | "medium" | "large">("captionSize", "medium");
  const [keyboardMode, setKeyboardMode] = useLocalStorage("keyboardMode", false);
  const [focusRingColor, setFocusRingColor] = useLocalStorage("focusRingColor", "#1a73e8");

  // Handle system preferences
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReducedMotion.matches) {
      setReducedMotion(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setKeyboardMode(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardMode(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [setKeyboardMode, setReducedMotion]);

  // Apply accessibility classes to document
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
    document.documentElement.classList.toggle("keyboard-mode", keyboardMode);
    document.documentElement.setAttribute("data-caption-size", captionSize);
    
    if (screenReaderEnabled) {
      document.documentElement.setAttribute("role", "application");
    } else {
      document.documentElement.removeAttribute("role");
    }
  }, [highContrast, reducedMotion, keyboardMode, captionSize, screenReaderEnabled]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        screenReaderEnabled,
        reducedMotion,
        captionSize,
        keyboardMode,
        focusRingColor,
        setHighContrast,
        setScreenReaderEnabled,
        setReducedMotion,
        setCaptionSize,
        setKeyboardMode,
        setFocusRingColor,
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