import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { toast } from 'sonner';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  modalStack: string[];
}

type UIAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'PUSH_MODAL'; payload: string }
  | { type: 'POP_MODAL' };

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  modalStack: [],
};

const UIContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  pushModal: (modalId: string) => void;
  popModal: () => void;
} | null>(null);

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'PUSH_MODAL':
      return { ...state, modalStack: [...state.modalStack, action.payload] };
    case 'POP_MODAL':
      return { ...state, modalStack: state.modalStack.slice(0, -1) };
    default:
      return state;
  }
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
    toast.success(`Switched to ${state.theme === 'light' ? 'dark' : 'light'} theme`);
  }, [state.theme]);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const pushModal = useCallback((modalId: string) => {
    dispatch({ type: 'PUSH_MODAL', payload: modalId });
  }, []);

  const popModal = useCallback(() => {
    dispatch({ type: 'POP_MODAL' });
  }, []);

  return (
    <UIContext.Provider
      value={{
        state,
        dispatch,
        toggleTheme,
        toggleSidebar,
        pushModal,
        popModal,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}