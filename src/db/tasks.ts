import { getDb } from './setup';

export interface Task {
  id: string;
  title: string;
  dueAt: number | null;
  type: 'deadline' | 'fixedTime';
  notifyId: string | null;
  completedAt: number | null;
  lang: 'en' | 'zh';
  createdAt: number;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function addTask(
  title: string,
  dueAt: number | null,
  type: 'deadline' | 'fixedTime',
  lang: 'en' | 'zh' = 'en',
): Promise<Task> {
  const db = await getDb();
  const task: Task = {
    id: uid(),
    title,
    dueAt,
    type,
    notifyId: null,
    completedAt: null,
    lang,
    createdAt: Date.now(),
  };
  await db.runAsync(
    `INSERT INTO tasks (id, title, dueAt, type, notifyId, completedAt, lang, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    task.id, task.title, task.dueAt, task.type,
    task.notifyId, task.completedAt, task.lang, task.createdAt,
  );
  return task;
}

export async function listTasks(): Promise<Task[]> {
  const db = await getDb();
  return db.getAllAsync<Task>(
    'SELECT * FROM tasks ORDER BY completedAt IS NOT NULL, dueAt ASC, createdAt DESC',
  );
}

export async function completeTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tasks SET completedAt = ? WHERE id = ?',
    Date.now(), id,
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
}

export async function setNotifyId(taskId: string, notifyId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tasks SET notifyId = ? WHERE id = ?',
    notifyId, taskId,
  );
}
