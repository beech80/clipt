import { create } from 'zustand';

interface ReportDialogStore {
  isOpen: boolean;
  contentId: string;
  contentType: 'post' | 'comment' | 'stream' | 'chat_message';
  openReportDialog: (contentId: string, contentType: 'post' | 'comment' | 'stream' | 'chat_message') => void;
  closeReportDialog: () => void;
}

export const useReportDialog = create<ReportDialogStore>((set) => ({
  isOpen: false,
  contentId: '',
  contentType: 'post',
  openReportDialog: (contentId, contentType) => set({ isOpen: true, contentId, contentType }),
  closeReportDialog: () => set({ isOpen: false, contentId: '', contentType: 'post' }),
}));