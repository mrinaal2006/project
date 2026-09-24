import fs from 'fs';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';
const dataDir = isProd ? '/tmp/data/projects' : path.join(process.cwd(), 'data', 'projects');

// Ensure base dir exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export type FileNode = {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
};

function buildFileTree(dir: string, basePath: string = ''): FileNode[] {
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
        children: buildFileTree(itemPath, relPath),
      });
    } else {
      nodes.push({
        name: item,
        type: 'file',
        path: relPath,
      });
    }
  }

  // Sort folders first, then files
  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });
}

export function getUserFileSystem(userId: string): FileNode[] {
  const userDir = path.join(dataDir, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return buildFileTree(userDir);
}

export function createItem(userId: string, itemPath: string, type: 'file' | 'folder') {
  const fullPath = path.join(dataDir, userId, itemPath);
  
  // Prevent directory traversal
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

export function saveFileContent(userId: string, itemPath: string, content: string) {
  const fullPath = path.join(dataDir, userId, itemPath);
  if (!fullPath.startsWith(path.join(dataDir, userId))) {
    throw new Error('Invalid path');
  }
  fs.writeFileSync(fullPath, content);
}

export function getFileContent(userId: string, itemPath: string): string {
  const fullPath = path.join(dataDir, userId, itemPath);
  if (!fullPath.startsWith(path.join(dataDir, userId))) {
    throw new Error('Invalid path');
  }
  if (!fs.existsSync(fullPath)) {
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}
