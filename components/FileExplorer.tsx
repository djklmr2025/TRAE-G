import React from 'react';
import { Download, FileText, Code, Hash, FileJson, File, Github } from 'lucide-react';
import { VirtualFile } from '../types';

interface FileExplorerProps {
  files: VirtualFile[];
  activeFile: VirtualFile | null;
  onSelectFile: (file: VirtualFile) => void;
  onDownloadZip: () => void;
  onPublishGitHub: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFile, onSelectFile, onDownloadZip, onPublishGitHub }) => {
  const getIcon = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.ts')) return <Code size={14} className="text-blue-400" />;
    if (name.endsWith('.css')) return <Hash size={14} className="text-blue-300" />;
    if (name.endsWith('.json')) return <FileJson size={14} className="text-yellow-400" />;
    return <FileText size={14} className="text-gray-400" />;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-ide-border text-xs font-semibold text-ide-text uppercase tracking-wider flex items-center gap-2">
        <File size={14} />
        <span>Workspace</span>
      </div>
      <div className="p-2 border-b border-ide-border grid grid-cols-2 gap-2">
        <button
          onClick={onDownloadZip}
          disabled={files.length === 0}
          className="flex items-center justify-center gap-1 rounded bg-ide-bg border border-ide-border px-2 py-1.5 text-[11px] text-gray-300 hover:border-google-blue hover:text-white disabled:opacity-40 disabled:hover:border-ide-border"
          title="Descargar ZIP del workspace virtual"
        >
          <Download size={13} />
          ZIP
        </button>
        <button
          onClick={onPublishGitHub}
          disabled={files.length === 0}
          className="flex items-center justify-center gap-1 rounded bg-ide-bg border border-ide-border px-2 py-1.5 text-[11px] text-gray-300 hover:border-google-blue hover:text-white disabled:opacity-40 disabled:hover:border-ide-border"
          title="Crear repo GitHub con los archivos virtuales"
        >
          <Github size={13} />
          GitHub
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-600 italic">
            No files generated yet. <br/>Ask Trae-G to write some code.
          </div>
        ) : (
          files.map((file, idx) => (
            <button
              key={`${file.name}-${idx}`}
              onClick={() => onSelectFile(file)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                activeFile?.name === file.name 
                  ? 'bg-google-blue/10 text-google-blue border-r-2 border-google-blue' 
                  : 'text-gray-400 hover:bg-ide-border hover:text-gray-200'
              }`}
            >
              {getIcon(file.name)}
              <span className="truncate">{file.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
