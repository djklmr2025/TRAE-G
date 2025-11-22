import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { VirtualFile } from '../types';
import { Copy, Check } from 'lucide-react';

// Register languages
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);

interface CodeEditorProps {
  file: VirtualFile | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file }) => {
  const [copied, setCopied] = React.useState(false);

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-ide-bg">
        <div className="w-16 h-16 mb-4 opacity-20 bg-gradient-to-br from-google-blue to-google-red rounded-xl"></div>
        <h3 className="text-lg font-medium text-ide-textLight">Trae-G Editor</h3>
        <p className="text-sm max-w-md text-center mt-2">
          Select a file from the explorer or ask the AI to generate a new component to view the code here.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E]">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-4 h-10 bg-ide-sidebar border-b border-ide-border">
        <span className="text-sm text-gray-300 font-mono">{file.name}</span>
        <button 
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          title="Copy Code"
        >
          {copied ? <Check size={14} className="text-google-green" /> : <Copy size={14} />}
        </button>
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <SyntaxHighlighter
          language={file.language === 'tsx' || file.language === 'ts' ? 'typescript' : file.language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: '"JetBrains Mono", monospace',
          }}
          showLineNumbers={true}
          lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#606366', textAlign: 'right' }}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeEditor;