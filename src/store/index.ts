import { Platform } from 'react-native';
import { create } from 'zustand';
import type { Task, Habit, Message } from '../db';
import { scheduleTaskNotification, cancelNotification } from '../notifications';

/**
 * The global app store (Zustand).
 *
 * On native (phone), the store talks to SQLite for persistence.
 * On web, SQLite isn't available, so the store runs in-memory only
 * (messages disappear on page refresh, but the chat works fine for dev).
 *
 * The store wraps our database helpers so the flow is:
 *   UI action → store method → (database write if native) → update store state → UI re-renders
 */

const isWeb = Platform.OS === 'web';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export interface HabitWithStreak extends Habit {
  streak: number;
  checkedInToday: boolean;
}

interface AppState {
  tasks: Task[];
  habits: HabitWithStreak[];
  messages: Message[];
  isLoaded: boolean;

  loadAll: () => Promise<void>;

  addTask: (title: string, dueAt: number | null, type: 'deadline' | 'fixedTime', lang?: 'en' | 'zh') => Promise<Task>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  addHabit: (name: string, emoji?: string) => Promise<Habit>;
  checkInHabit: (habitId: string) => Promise<boolean>;

  addMessage: (role: 'user' | 'cat', text: string) => Promise<Message>;
}

export const useStore = create<AppState>((set, get) => ({
  tasks: [],
  habits: [],
  messages: [],
  isLoaded: false,

  loadAll: async () => {
    if (isWeb) {
      // On web, skip database — just mark as loaded with empty data
      set({ isLoaded: true });
      return;
    }

    try {
      const { listTasks, listHabits, listMessages, getStreak, isCheckedInToday } = await import('../db');

      const [tasks, habits, messages] = await Promise.all([
        listTasks(),
        listHabits(),
        listMessages(),
      ]);

      const habitsWithStreaks: HabitWithStreak[] = await Promise.all(
        habits.map(async (h) => {
          const streak = await getStreak(h.id);
          const checked = await isCheckedInToday(h.id);
          return { ...h, streak, checkedInToday: checked };
        }),
      );

      set({ tasks, habits: habitsWithStreaks, messages, isLoaded: true });
    } catch (e) {
      console.warn('Database load failed, running in-memory mode:', e);
      set({ isLoaded: true });
    }
  },

  addTask: async (title, dueAt, type, lang = 'en') => {
    const task: Task = {
      id: uid(), title, dueAt, type,
      notifyId: null, completedAt: null, lang, createdAt: Date.now(),
    };

    let saved = task;

    if (!isWeb) {
      try {
        const { addTask: dbAdd } = await import('../db');
        saved = await dbAdd(title, dueAt, type, lang);
      } catch { /* fall through to in-memory */ }
    }

    if (dueAt) {
      const notifyId = await scheduleTaskNotification(title, dueAt, type, lang);
      if (notifyId) {
        saved = { ...saved, notifyId };
        if (!isWeb) {
          try {
            const { setNotifyId } = await import('../db');
            await setNotifyId(saved.id, notifyId);
          } catch { /* best-effort */ }
        }
      }
    }

    set((s) => ({ tasks: [saved, ...s.tasks] }));
    return saved;
  },

  completeTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task?.notifyId) {
      await cancelNotification(task.notifyId);
    }

    if (!isWeb) {
      try {
        const { completeTask: dbComplete } = await import('../db');
        await dbComplete(id);
      } catch { /* continue with in-memory update */ }
    }
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, completedAt: Date.now() } : t,
      ),
    }));
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task?.notifyId) {
      await cancelNotification(task.notifyId);
    }

    if (!isWeb) {
      try {
        const { deleteTask: dbDel } = await import('../db');
        await dbDel(id);
      } catch { /* continue */ }
    }
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  addHabit: async (name, emoji = '✨') => {
    const habit: Habit = {
      id: uid(), name, emoji, createdAt: Date.now(), archivedAt: null,
    };

    if (!isWeb) {
      try {
        const { addHabit: dbAdd } = await import('../db');
        const saved = await dbAdd(name, emoji);
        const withStreak: HabitWithStreak = { ...saved, streak: 0, checkedInToday: false };
        set((s) => ({ habits: [...s.habits, withStreak] }));
        return saved;
      } catch { /* fall through */ }
    }

    const withStreak: HabitWithStreak = { ...habit, streak: 0, checkedInToday: false };
    set((s) => ({ habits: [...s.habits, withStreak] }));
    return habit;
  },

  checkInHabit: async (habitId) => {
    if (!isWeb) {
      try {
        const { checkInHabit: dbCheck, getStreak } = await import('../db');
        const result = await dbCheck(habitId);
        if (!result) return false;
        const streak = await getStreak(habitId);
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === habitId ? { ...h, streak, checkedInToday: true } : h,
          ),
        }));
        return true;
      } catch { /* fall through */ }
    }

    // In-memory fallback
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit || habit.checkedInToday) return false;
    set((s) => ({
      habits: s.habits.map((h) =>
        h.id === habitId ? { ...h, streak: h.streak + 1, checkedInToday: true } : h,
      ),
    }));
    return true;
  },

  addMessage: async (role, text) => {
    const msg: Message = { id: uid(), role, text, createdAt: Date.now() };

    if (!isWeb) {
      try {
        const { addMessage: dbAdd } = await import('../db');
        const saved = await dbAdd(role, text);
        set((s) => ({ messages: [...s.messages, saved] }));
        return saved;
      } catch { /* fall through */ }
    }

    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },
}));
