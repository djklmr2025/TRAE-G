import React, { useState, useEffect } from 'react';
import { Message, VirtualFile, GeminiModel } from './types';
import ChatInterface from './components/ChatInterface';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import TerminalPanel from './components/TerminalPanel';
import { initGemini, startChat, sendMessageStream } from './services/geminiService';
import { downloadWorkspaceZip, publishWorkspaceToGitHub } from './services/workspaceExport';
import { buildMemoryContext, clearMemory, downloadChatLog, loadMessages, saveMessages, saveRemoteMemory, searchRemoteMemory } from './services/memoryService';
import { parseCodeToFiles } from './utils/codeParser';

function App() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [activeFile, setActiveFile] = useState<VirtualFile | null>(null);
  const [currentModel, setCurrentModel] = useState<GeminiModel>(GeminiModel.FLASH);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const restored = loadMessages();
    if (restored.length > 0) {
      setMessages(restored);
      setHasStarted(true);
    }
  }, []);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Initialize Chat
  useEffect(() => {
    initGemini();
    try {
      startChat(currentModel);
    } catch (error) {
      console.warn("Arkaios chat is not ready:", error);
    }
  }, [currentModel]);

  const handleSendMessage = async (text: string) => {
    if (!hasStarted) setHasStarted(true);
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const localMemory = buildMemoryContext([...messages, userMsg]);
      const remoteMemory = await searchRemoteMemory(text);
      const stream = sendMessageStream(text, [localMemory, remoteMemory ? `Memoria remota Supermemory:\n${remoteMemory}` : ""].filter(Boolean).join("\n\n"));

      const botMsgId = (Date.now() + 1).toString();
      let fullContent = '';

      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      }]);

      for await (const chunk of stream) {
        fullContent += chunk;

        // Update Message UI
        setMessages(prev => prev.map(msg =>
          msg.id === botMsgId ? { ...msg, content: fullContent } : msg
        ));

        // Real-time Code Parsing
        const newFiles = parseCodeToFiles(fullContent);
        if (newFiles.length > 0) {
          setFiles(prev => {
            // Merge new files with existing, overwriting if name matches
            const fileMap = new Map(prev.map(f => [f.name, f]));
            newFiles.forEach(f => fileMap.set(f.name, f));
            return Array.from(fileMap.values());
          });

          // Auto-select the first file if none selected
          if (!activeFile && newFiles.length > 0) {
            setActiveFile(newFiles[0]);
          } else if (activeFile) {
            // If active file is being updated, trigger re-render by updating reference
            const updatedActive = newFiles.find(f => f.name === activeFile.name);
            if (updatedActive) setActiveFile(updatedActive);
          }
        }
      }
      await saveRemoteMemory(text, fullContent);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "Arkaios no pudo responder. Revisa tu conexion, el login de Puter AI o que el servicio local este activo. API key de usuario: no se necesita.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => ({ ...msg, isStreaming: false })));
    }
  };

  const handleModelChange = (model: GeminiModel) => {
    setCurrentModel(model);
    startChat(model);
  };

  const addSystemMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      content,
      timestamp: Date.now()
    }]);
  };

  const handleDownloadZip = () => {
    try {
      downloadWorkspaceZip(files);
      addSystemMessage(`ZIP creado para descarga con ${files.length} archivo(s) del workspace virtual.`);
    } catch (error) {
      addSystemMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handlePublishGitHub = async () => {
    setIsLoading(true);
    try {
      const result = await publishWorkspaceToGitHub(files);
      addSystemMessage(`GitHub: ${result}`);
    } catch (error) {
      addSystemMessage(error instanceof Error ? `GitHub no pudo publicar: ${error.message}` : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadLog = () => {
    downloadChatLog(messages, files);
  };

  const handleClearMemory = () => {
    clearMemory();
    setMessages([]);
    setFiles([]);
    setActiveFile(null);
    setHasStarted(false);
  };

  return (
    <div className="flex h-screen w-screen bg-ide-bg text-ide-text font-sans overflow-hidden">
      {/* Left: Chat Sidebar (Width 350px fixed for now) */}
      <div className="w-[380px] flex-shrink-0 h-full flex flex-col border-r border-ide-border">
        <div className="p-3 bg-ide-sidebar border-b border-ide-border flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-bold text-blue-400 tracking-wider">ARKAIOS</span>
          </div>
          <span className="text-xs text-gray-400 font-mono border border-gray-700 px-2 py-0.5 rounded">Local/Web Core</span>
        </div>
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          currentModel={currentModel}
          onSendMessage={handleSendMessage}
          onModelChange={handleModelChange}
          onDownloadLog={handleDownloadLog}
          onClearMemory={handleClearMemory}
        />
      </div>

      {/* Middle: File Explorer (Narrow) */}
      <div className="w-[200px] flex-shrink-0 h-full bg-ide-sidebar border-r border-ide-border hidden md:block">
        <FileExplorer
          files={files}
          activeFile={activeFile}
          onSelectFile={setActiveFile}
          onDownloadZip={handleDownloadZip}
          onPublishGitHub={handlePublishGitHub}
        />
      </div>

      {/* Right: Editor Workspace */}
      <div className="flex-1 h-full min-w-0 bg-[#1E1E1E] flex flex-col">
        <div className="flex-1 min-h-0">
          <CodeEditor file={activeFile} />
        </div>
        <div className="h-[34%] min-h-[220px]">
          <TerminalPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
