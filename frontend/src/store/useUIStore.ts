import { create } from 'zustand';

export interface ExportData {
  title: string;
  filename: string;
  columns: string[];
  rows: any[][];
  type: 'statement' | 'receipt' | 'report';
}

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

interface UIState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  isSearchOpen: boolean;
  isNotificationDrawerOpen: boolean;
  activeModal: 'deposit' | 'withdrawal' | 'storeBill' | 'distribution' | 'collection' | 'borrower' | 'recovery' | 'adjustment' | 'addStudent' | 'branch' | 'template' | 'batch' | 'event' | 'printExport' | null;
  selectedStudentId: string | null;
  selectedBatchId: string | null;
  selectedPresetId: string | null;
  exportData: ExportData | null;
  currentWizardStep: number;
  confirmationConfig: ConfirmationConfig | null;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setNotificationDrawerOpen: (open: boolean) => void;
  setActiveModal: (modal: UIState['activeModal'], studentId?: string) => void;
  setSelectedBatchId: (id: string | null) => void;
  setSelectedPresetId: (id: string | null) => void;
  setExportData: (data: ExportData | null) => void;
  setWizardStep: (step: number) => void;
  openConfirmation: (config: ConfirmationConfig) => void;
  closeConfirmation: () => void;
  closeAll: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  isCommandPaletteOpen: false,
  isSearchOpen: false,
  isNotificationDrawerOpen: false,
  activeModal: null,
  selectedStudentId: null,
  selectedBatchId: null,
  selectedPresetId: null,
  exportData: null,
  currentWizardStep: 1,
  confirmationConfig: null,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setNotificationDrawerOpen: (open) => set({ isNotificationDrawerOpen: open }),
  setActiveModal: (modal, studentId) => set({ activeModal: modal, selectedStudentId: studentId || null, currentWizardStep: 1 }),
  setSelectedBatchId: (id) => set({ selectedBatchId: id }),
  setSelectedPresetId: (id) => set({ selectedPresetId: id }),
  setExportData: (data) => set({ exportData: data }),
  setWizardStep: (step) => set({ currentWizardStep: step }),
  openConfirmation: (config) => set({ confirmationConfig: config }),
  closeConfirmation: () => set({ confirmationConfig: null }),
  closeAll: () => set({ 
    isCommandPaletteOpen: false, 
    isSearchOpen: false, 
    isNotificationDrawerOpen: false,
    activeModal: null,
    selectedStudentId: null,
    selectedBatchId: null,
    selectedPresetId: null,
    exportData: null,
    currentWizardStep: 1,
    confirmationConfig: null
  }),
}));
