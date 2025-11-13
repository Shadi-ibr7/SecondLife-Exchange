'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationsState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: (by?: number) => void;
  clear: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      unreadCount: 0,
      setUnreadCount: (count: number) =>
        set({ unreadCount: Math.max(0, count) }),
      increment: (by = 1) =>
        set((s) => ({ unreadCount: Math.max(0, s.unreadCount + by) })),
      clear: () => set({ unreadCount: 0 }),
    }),
    {
      name: 'notifications-store',
      partialize: (s) => ({ unreadCount: s.unreadCount }),
    }
  )
);

