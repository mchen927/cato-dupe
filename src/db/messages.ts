import { getDb } from './setup';

export interface Message {
  id: string;
  role: 'user' | 'cat';
  text: string;
  createdAt: number;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function addMessage(role: 'user' | 'cat', text: string): Promise<Message> {
  const db = await getDb();
  const msg: Message = {
    id: uid(),
    role,
    text,
    createdAt: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO messages (id, role, text, createdAt) VALUES (?, ?, ?, ?)',
    msg.id, msg.role, msg.text, msg.createdAt,
  );
  return msg;
}

export async function listMessages(limit = 100): Promise<Message[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Message>(
    'SELECT * FROM messages ORDER BY createdAt DESC LIMIT ?',
    limit,
  );
  return rows.reverse();
}

export async function clearMessages(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM messages');
}
