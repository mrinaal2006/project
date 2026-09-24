'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Folder, File as FileIcon, Plus, FolderPlus, FilePlus, ChevronRight } from 'lucide-react';
import { FileNode } from '@/lib/files';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(''); // empty means root
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchFiles();
    }
  }, [status, router]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setFileTree(data.tree);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !showCreateModal) return;

    const path = currentPath ? `${currentPath}/${newItemName}` : newItemName;
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type: showCreateModal }),
      });
      
      if (res.ok) {
        setShowCreateModal(null);
        setNewItemName('');
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCurrentNodes = () => {
    if (!currentPath) return fileTree;
    const parts = currentPath.split('/');
    let currentNodes = fileTree;
    
    for (const part of parts) {
      const folder = currentNodes.find(n => n.name === part && n.type === 'folder');
      if (folder) {
        currentNodes = folder.children || [];
      } else {
        return [];
      }
    }
    return currentNodes;
  };

  const nodes = getCurrentNodes();

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  if (loading || status === 'loading') {
    return <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Your Projects</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontSize: '14px' }}>
            <span style={{ cursor: 'pointer', fontWeight: !currentPath ? 600 : 400 }} onClick={() => setCurrentPath('')}>
              Home
            </span>
            {currentPath.split('/').filter(Boolean).map((part, index, arr) => (
              <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChevronRight size={14} />
                <span 
                  style={{ cursor: 'pointer', fontWeight: index === arr.length - 1 ? 600 : 400 }}
                  onClick={() => setCurrentPath(arr.slice(0, index + 1).join('/'))}
                >
                  {part}
                </span>
              </span>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => setShowCreateModal('folder')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={16} /> New Folder
          </button>
          <button onClick={() => setShowCreateModal('file')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilePlus size={16} /> New File
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'var(--secondary-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
            Create New {showCreateModal === 'folder' ? 'Folder' : 'File'}
          </h3>
          <form onSubmit={handleCreateItem} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder={`Enter ${showCreateModal} name...`}
              style={{ flex: 1, marginBottom: 0 }}
              autoFocus
              required
            />
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" onClick={() => setShowCreateModal(null)} className="btn-secondary">Cancel</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {currentPath && (
          <div 
            onClick={handleNavigateUp}
            style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-color)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <Folder size={48} color="var(--accent-color)" style={{ marginBottom: '12px' }} />
            <span style={{ fontWeight: 600 }}>.. (Go Back)</span>
          </div>
        )}
        
        {nodes.map(node => (
          node.type === 'folder' ? (
            <div 
              key={node.path}
              onClick={() => setCurrentPath(node.path)}
              style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--secondary-color)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <Folder size={48} color="var(--primary-color)" style={{ marginBottom: '12px' }} />
              <span style={{ fontWeight: 600 }}>{node.name}</span>
            </div>
          ) : (
            <Link 
              href={`/editor?file=${encodeURIComponent(node.path)}`}
              key={node.path}
              style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-color)', transition: 'transform 0.2s, box-shadow 0.2s', textDecoration: 'none', color: 'inherit' }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <FileIcon size={48} color="var(--accent-color)" style={{ marginBottom: '12px' }} />
              <span style={{ fontWeight: 600 }}>{node.name}</span>
            </Link>
          )
        ))}
        
        {nodes.length === 0 && !currentPath && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--accent-color)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            No files or folders yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
