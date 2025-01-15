import { create } from 'zustand';

interface SheetState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useSheetState = create<SheetState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));