'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Save, ArrowLeft, X, TerminalSquare } from 'lucide-react';
import Link from 'next/link';

const LANGUAGES = [
  { id: 100, name: 'Python (3.12.5)', value: 'python', defaultCode: 'print("Hello, World!")' },
  { id: 102, name: 'JavaScript (Node.js 22.08.0)', value: 'javascript', defaultCode: 'console.log("Hello, World!");' },
  { id: 105, name: 'C++ (GCC 14.1.0)', value: 'cpp', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
  { id: 91, name: 'Java (JDK 17.0.6)', value: 'java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
  { id: 108, name: 'Rust (1.85.0)', value: 'rust', defaultCode: 'fn main() {\n    println!("Hello, World!");\n}' },
];

export function EditorClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const openedFile = searchParams.get('file');

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingFile, setLoadingFile] = useState(!!openedFile);

  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setTerminalHeight(prev => {
        const newHeight = prev - e.movementY;
        return Math.max(50, Math.min(newHeight, 800)); // constraints
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (openedFile) {
      handleOpenFile(openedFile);
    }
  }, [openedFile]);

  const handleOpenFile = async (path: string) => {
    setLoadingFile(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setCode(data.content || '');
        
        // Auto-detect language
        if (path.endsWith('.py')) setSelectedLang(LANGUAGES[0]);
        else if (path.endsWith('.js')) setSelectedLang(LANGUAGES[1]);
        else if (path.endsWith('.cpp')) setSelectedLang(LANGUAGES[2]);
        else if (path.endsWith('.java')) setSelectedLang(LANGUAGES[3]);
        else if (path.endsWith('.rs')) setSelectedLang(LANGUAGES[4]);
      } else {
        router.push('/dashboard');
      }
    } finally {
      setLoadingFile(false);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find(l => l.id.toString() === e.target.value);
    if (lang) {
      setSelectedLang(lang);
      if (!openedFile) {
        setCode(lang.defaultCode);
      }
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setIsTerminalOpen(true);
    setOutput('Compiling and running...');

    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLang.id,
          stdin: input,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        if (data.stderr) {
          setOutput(`Error:\n${data.stderr}`);
        } else if (data.compile_output) {
          setOutput(`Compilation Error:\n${data.compile_output}`);
        } else {
          setOutput(data.stdout || 'Program finished with no output.');
        }
      } else {
        setOutput(`Request Error:\n${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveFile = async () => {
    if (!openedFile) return;
    setIsSaving(true);
    try {
      await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: openedFile, content: code }),
      });
      // Optionally show a toast notification here
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingFile) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your code...</div>;
  }

  return (
    <div className="editor-layout">
      {/* Code Settings Sidebar */}
      <aside className="editor-sidebar" style={{ width: '250px' }}>
        <Link href="/dashboard" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        
        <div>
          <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Language</label>
          <select value={selectedLang.id} onChange={handleLanguageChange} style={{ width: '100%' }}>
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Custom Input</label>
          <textarea 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            rows={5} 
            placeholder="Enter input here..."
            style={{ resize: 'none' }}
          ></textarea>
        </div>

        <button 
          onClick={handleRun} 
          disabled={isRunning} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto' }}
        >
          {isRunning ? <RotateCcw size={16} className="animate-spin" /> : <Play size={16} />}
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </aside>
      
      <div className="editor-main">
        <div className="editor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600 }}>{selectedLang.name} Editor</span>
            {openedFile && (
              <span style={{ fontSize: 13, color: 'var(--accent-color)' }}>- {openedFile}</span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isTerminalOpen && (
              <button 
                onClick={() => setIsTerminalOpen(true)}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}
              >
                <TerminalSquare size={14} /> Output
              </button>
            )}
            {openedFile && (
              <button 
                onClick={handleSaveFile}
                disabled={isSaving}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save File'}
              </button>
            )}
          </div>
        </div>
        <div className="editor-container">
          <Editor
            height="100%"
            language={selectedLang.value}
            theme="light"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
            }}
          />
        </div>
        {isTerminalOpen && (
          <>
            <div 
              onMouseDown={() => setIsDragging(true)}
              style={{ 
                height: '8px', 
                cursor: 'ns-resize', 
                backgroundColor: isDragging ? 'var(--accent-color)' : 'transparent',
                transition: 'background-color 0.2s',
                width: '100%',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                marginTop: '-1px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color)'}
              onMouseLeave={(e) => !isDragging && (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Drag to resize terminal"
            />
            <div className="terminal-container" style={{ height: `${terminalHeight}px`, borderTop: 'none' }}>
              <div className="terminal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Output</span>
                <button onClick={() => setIsTerminalOpen(false)} style={{ color: '#888', padding: '4px', cursor: 'pointer', display: 'flex' }} title="Close Output">
                  <X size={16} />
                </button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {output || 'Output will appear here...'}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
