import { create } from 'zustand';

interface NavigationState {
  scrollY: number;
  activeSection: 'function' | 'content';
  hoveredElement: string | null;
  activeDepartment: string | null;
  setScrollY: (y: number) => void;
  setActiveSection: (section: 'function' | 'content') => void;
  setHoveredElement: (element: string | null) => void;
  setActiveDepartment: (dept: string | null) => void;
}

export const useNavigationState = create<NavigationState>((set) => ({
  scrollY: 0,
  activeSection: 'function',
  hoveredElement: null,
  activeDepartment: null,
  setScrollY: (y) => set({ scrollY: y }),
  setActiveSection: (section) => set({ activeSection: section }),
  setHoveredElement: (element) => set({ hoveredElement: element }),
  setActiveDepartment: (dept) => set({ activeDepartment: dept }),
}));
