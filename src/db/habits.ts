import { getDb } from './setup';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
  archivedAt: number | null;
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD'
  createdAt: number;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Today's date as YYYY-MM-DD in local time. */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function addHabit(name: string, emoji = '✨'): Promise<Habit> {
  const db = await getDb();
  const habit: Habit = {
    id: uid(),
    name,
    emoji,
    createdAt: Date.now(),
    archivedAt: null,
  };
  await db.runAsync(
    'INSERT INTO habits (id, name, emoji, createdAt, archivedAt) VALUES (?, ?, ?, ?, ?)',
    habit.id, habit.name, habit.emoji, habit.createdAt, habit.archivedAt,
  );
  return habit;
}

export async function listHabits(): Promise<Habit[]> {
  const db = await getDb();
  return db.getAllAsync<Habit>(
    'SELECT * FROM habits WHERE archivedAt IS NULL ORDER BY createdAt ASC',
  );
}

/**
 * Check in a habit for today.
 * Returns the CheckIn if created, or null if already checked in today.
 */
export async function checkInHabit(habitId: string): Promise<CheckIn | null> {
  const db = await getDb();
  const date = todayStr();

  const existing = await db.getFirstAsync<CheckIn>(
    'SELECT * FROM checkins WHERE habitId = ? AND date = ?',
    habitId, date,
  );
  if (existing) return null;

  const checkin: CheckIn = {
    id: uid(),
    habitId,
    date,
    createdAt: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO checkins (id, habitId, date, createdAt) VALUES (?, ?, ?, ?)',
    checkin.id, checkin.habitId, checkin.date, checkin.createdAt,
  );
  return checkin;
}

/**
 * Calculate the current streak for a habit.
 *
 * Walks backwards from today counting consecutive days with a check-in.
 * If today hasn't been checked in yet, starts from yesterday.
 */
export async function getStreak(habitId: string): Promise<number> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM checkins WHERE habitId = ? ORDER BY date DESC',
    habitId,
  );

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = todayStr();
  let checkDate = new Date();

  // If today isn't checked in, start counting from yesterday
  if (rows[0].date !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const row of rows) {
    const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (row.date === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** Check if a habit has been checked in today. */
export async function isCheckedInToday(habitId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT id FROM checkins WHERE habitId = ? AND date = ?',
    habitId, todayStr(),
  );
  return row !== null;
}
