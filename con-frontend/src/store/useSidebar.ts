import { create } from 'zustand';

interface SidebarState {
  isExpanded: boolean;
  toggle: () => void;
  setExpanded: (val: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isExpanded: false,
  toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (val) => set({ isExpanded: val }),
}));
