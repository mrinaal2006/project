import fs from 'fs';
import path from 'path';

export type User = {
  id: string;
  name?: string;
  password?: string;
};

const isProd = process.env.NODE_ENV === 'production';
const dataDir = isProd ? '/tmp/data' : path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');

export function initDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
  }
}

export function getUsers(): User[] {
  initDb();
  const data = fs.readFileSync(usersFile, 'utf8');
  return JSON.parse(data || '[]');
}

export function saveUsers(users: User[]) {
  initDb();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function addUser(user: User) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(id: string, updates: Partial<User>) {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
  }
}
