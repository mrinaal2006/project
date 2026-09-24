import fs from 'fs';
import path from 'path';
import { hasDb, query, initPostgresDb } from './db';

export type User = {
  id: string;
  name?: string;
  password?: string;
};

const isProd = process.env.NODE_ENV === 'production';
const dataDir = isProd ? '/tmp/data' : path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');

export async function initDb() {
  if (hasDb) {
    await initPostgresDb();
    return;
  }
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
  }
}

export async function getUsers(): Promise<User[]> {
  if (hasDb) {
    const res = await query('SELECT * FROM users');
    return res.rows;
  }

  await initDb();
  const data = fs.readFileSync(usersFile, 'utf8');
  return JSON.parse(data || '[]');
}

export async function saveUsers(users: User[]) {
  if (hasDb) return; // Managed by DB individually
  await initDb();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (hasDb) {
    await initDb();
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
  }

  const users = await getUsers();
  return users.find((u) => u.id === id);
}

export async function addUser(user: User) {
  if (hasDb) {
    await initDb();
    await query('INSERT INTO users(id, name, password) VALUES($1, $2, $3)', [user.id, user.name, user.password]);
    return;
  }

  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
}

export async function updateUser(id: string, updates: Partial<User>) {
  if (hasDb) {
    await initDb();
    if (updates.password) {
      await query('UPDATE users SET password = $1 WHERE id = $2', [updates.password, id]);
    }
    return;
  }

  const users = await getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    await saveUsers(users);
  }
}
