import { create } from 'zustand';
import { layers } from '@/ui/layers';

export type WindowId = 'menu' | 'npc_dialogue' | 'shop' | 'inventory' | 'skills' | 'equipment' | 'quests' | 'status';

interface WindowManagerState {
  openWindows: WindowId[];
  minimizedWindows: WindowId[];
  nextZ: number;
  zIndices: Record<string, number>;
  tabs: Record<string, string | undefined>;

  open: (id: WindowId, tab?: string) => void;
  close: (id: WindowId) => void;
  toggle: (id: WindowId, tab?: string) => void;
  minimize: (id: WindowId) => void;
  focus: (id: WindowId) => void;
  isOpen: (id: WindowId) => boolean;
  isMinimized: (id: WindowId) => boolean;
  getZIndex: (id: WindowId) => number;
}

export const useWindowManager = create<WindowManagerState>((set, get) => ({
  openWindows: [],
  minimizedWindows: [],
  nextZ: layers.windows + 1,
  zIndices: {},
  tabs: {},

  open: (id, tab) => {
    const state = get();
    if (state.openWindows.includes(id)) {
      if (tab) {
        set((s) => ({ tabs: { ...s.tabs, [id]: tab } }));
      }
      get().focus(id);
      return;
    }
    const z = state.nextZ;
    set((s) => ({
      openWindows: [...s.openWindows, id],
      nextZ: s.nextZ + 1,
      zIndices: { ...s.zIndices, [id]: z },
      tabs: tab ? { ...s.tabs, [id]: tab } : s.tabs,
      minimizedWindows: s.minimizedWindows.filter((w) => w !== id),
    }));
  },

  close: (id) => {
    set((s) => ({
      openWindows: s.openWindows.filter((w) => w !== id),
      minimizedWindows: s.minimizedWindows.filter((w) => w !== id),
    }));
  },

  toggle: (id, tab) => {
    const state = get();
    if (state.openWindows.includes(id)) {
      state.close(id);
    } else {
      state.open(id, tab);
    }
  },

  minimize: (id) => {
    set((s) => ({
      minimizedWindows: s.minimizedWindows.includes(id)
        ? s.minimizedWindows.filter((w) => w !== id)
        : [...s.minimizedWindows, id],
    }));
  },

  focus: (id) => {
    const state = get();
    if (!state.openWindows.includes(id)) return;
    const z = state.nextZ;
    set((s) => ({
      nextZ: s.nextZ + 1,
      zIndices: { ...s.zIndices, [id]: z },
    }));
  },

  isOpen: (id) => get().openWindows.includes(id),
  isMinimized: (id) => get().minimizedWindows.includes(id),
  getZIndex: (id) => get().zIndices[id] || layers.windows + 1,
}));
