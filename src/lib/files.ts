import fs from 'fs';
import path from 'path';
import { hasDb, query, initPostgresDb } from './db';

export type FileNode = {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  createdAt?: string;
};

const isProd = process.env.NODE_ENV === 'production';
const dataDir = isProd ? '/tmp/data/projects' : path.join(process.cwd(), 'data', 'projects');

async function initFilesDb() {
  if (hasDb) {
    await initPostgresDb();
    return;
  }
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Convert flat DB paths to tree
function buildTreeFromPaths(rows: any[]): FileNode[] {
  const root: FileNode[] = [];

  for (const row of rows) {
    const parts = row.path.split('/');
    let currentLevel = root;
    
    let builtPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      builtPath = builtPath ? `${builtPath}/${part}` : part;
      
      let node = currentLevel.find(n => n.name === part);
      
      if (!node) {
        // If it's the last part, it takes the row's actual type. Otherwise it's an implied folder.
        const isLast = i === parts.length - 1;
        const type = isLast ? row.type : 'folder';
        
        node = {
          name: part,
          type: type as 'file' | 'folder',
          path: builtPath,
          children: type === 'folder' ? [] : undefined,
          createdAt: isLast ? row.created_at : undefined,
        };
        currentLevel.push(node);
      }
      
      if (node.type === 'folder') {
        if (!node.children) node.children = [];
        currentLevel = node.children;
      }
    }
  }

  // Helper to sort recursively
  const sortTree = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    for (const node of nodes) {
      if (node.children) sortTree(node.children);
    }
  };

  sortTree(root);
  return root;
}

function buildFileTreeSync(dir: string, basePath: string = ''): FileNode[] {
  if (!fs.existsSync(dir)) return [];
  
  const nodes: FileNode[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const relPath = path.posix.join(basePath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      nodes.push({
        name: item,
        type: 'folder',
        path: relPath,
        children: buildFileTreeSync(itemPath, relPath),
        createdAt: stat.birthtime.toISOString(),
      });
    } else {
      nodes.push({
        name: item,
        type: 'file',
        path: relPath,
        createdAt: stat.birthtime.toISOString(),
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });
}

export async function getUserFileSystem(userId: string): Promise<FileNode[]> {
  await initFilesDb();

  if (hasDb) {
    const res = await query('SELECT path, type, created_at FROM files WHERE user_id = $1 ORDER BY path ASC', [userId]);
    return buildTreeFromPaths(res.rows);
  }

  const userDir = path.join(dataDir, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return buildFileTreeSync(userDir);
}

export async function createItem(userId: string, itemPath: string, type: 'file' | 'folder') {
  await initFilesDb();

  if (hasDb) {
    await query(
      'INSERT INTO files (user_id, path, type, content) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, path) DO NOTHING',
      [userId, itemPath, type, '']
    );
    return;
  }

  const fullPath = path.join(dataDir, userId, itemPath);
  if (!fullPath.startsWith(path.join(dataDir, userId))) {
    throw new Error('Invalid path');
  }

  if (fs.existsSync(fullPath)) {
    throw new Error('Item already exists');
  }

  if (type === 'folder') {
    fs.mkdirSync(fullPath, { recursive: true });
  } else {
    fs.writeFileSync(fullPath, '');
  }
}

export async function saveFileContent(userId: string, itemPath: string, content: string) {
  await initFilesDb();

  if (hasDb) {
    await query(
      'UPDATE files SET content = $1 WHERE user_id = $2 AND path = $3 AND type = $4',
      [content, userId, itemPath, 'file']
    );
    return;
  }

  const fullPath = path.join(dataDir, userId, itemPath);
  if (!fullPath.startsWith(path.join(dataDir, userId))) {
    throw new Error('Invalid path');
  }
  fs.writeFileSync(fullPath, content);
}

export async function getFileContent(userId: string, itemPath: string): Promise<string> {
  await initFilesDb();

  if (hasDb) {
    const res = await query('SELECT content FROM files WHERE user_id = $1 AND path = $2 AND type = $3', [userId, itemPath, 'file']);
    if (res.rows.length === 0) return '';
    return res.rows[0].content || '';
  }

  const fullPath = path.join(dataDir, userId, itemPath);
  if (!fullPath.startsWith(path.join(dataDir, userId))) {
    throw new Error('Invalid path');
  }
  if (!fs.existsSync(fullPath)) {
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

export async function deleteItem(userId: string, itemPath: string) {
  await initFilesDb();

  if (hasDb) {
    // Delete exact match and any children (if folder)
    await query('DELETE FROM files WHERE user_id = $1 AND (path = $2 OR path LIKE $3)', [userId, itemPath, `${itemPath}/%`]);
    return;
  }

  const fullPath = path.join(dataDir, userId, itemPath);
  if (!fullPath.startsWith(path.join(dataDir, userId))) {
    throw new Error('Invalid path');
  }
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

export async function copyItem(userId: string, sourcePath: string, destPath: string) {
  await initFilesDb();

  if (hasDb) {
    // A bit tricky in SQL to copy trees, for now copy a single file
    const res = await query('SELECT type, content FROM files WHERE user_id = $1 AND path = $2', [userId, sourcePath]);
    if (res.rows.length === 0) throw new Error('Source not found');
    const { type, content } = res.rows[0];
    await query(
      'INSERT INTO files (user_id, path, type, content) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, path) DO NOTHING',
      [userId, destPath, type, content]
    );
    return;
  }

  const fullSrc = path.join(dataDir, userId, sourcePath);
  const fullDest = path.join(dataDir, userId, destPath);

  if (!fullSrc.startsWith(path.join(dataDir, userId)) || !fullDest.startsWith(path.join(dataDir, userId))) {
    throw new Error('Invalid path');
  }

  if (!fs.existsSync(fullSrc)) {
    throw new Error('Source not found');
  }
  if (fs.existsSync(fullDest)) {
    throw new Error('Destination already exists');
  }

  fs.cpSync(fullSrc, fullDest, { recursive: true });
}
