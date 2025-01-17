import { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface KeyboardShortcut {
  action: string;
  shortcut: string;
}

interface KeyboardShortcutsContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (action: string, shortcut: string) => Promise<void>;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const { data: shortcuts = [], refetch } = useQuery({
    queryKey: ['keyboard-shortcuts'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('keyboard_shortcuts')
        .select('action, shortcut')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const keys = [];
      if (event.ctrlKey) keys.push('Ctrl');
      if (event.shiftKey) keys.push('Shift');
      if (event.altKey) keys.push('Alt');
      if (event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt') {
        keys.push(event.key.toUpperCase());
      }
      
      const shortcutString = keys.join('+');
      
      const matchingShortcut = shortcuts.find(s => s.shortcut === shortcutString);
      if (matchingShortcut) {
        event.preventDefault();
        toast.success(`Action triggered: ${matchingShortcut.action}`);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  async function registerShortcut(action: string, shortcut: string) {
    if (!user) return;
    
    const { error } = await supabase
      .from('keyboard_shortcuts')
      .upsert({
        user_id: user.id,
        action,
        shortcut
      });

    if (error) {
      toast.error("Failed to save keyboard shortcut");
      return;
    }

    refetch();
    toast.success("Keyboard shortcut saved");
  }

  return (
    <KeyboardShortcutsContext.Provider value={{ shortcuts, registerShortcut }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (context === undefined) {
    throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutsProvider");
  }
  return context;
};