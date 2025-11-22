import React, { useState, useEffect } from 'react';
import { Message, VirtualFile, GeminiModel } from './types';
import ChatInterface from './components/ChatInterface';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import { initGemini, startChat, sendMessageStream } from './services/geminiService';
import { parseCodeToFiles } from './utils/codeParser';

function App() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [activeFile, setActiveFile] = useState<VirtualFile | null>(null);
  const [currentModel, setCurrentModel] = useState<GeminiModel>(GeminiModel.FLASH);
  const [hasStarted, setHasStarted] = useState(false);

  // Initialize Chat
  useEffect(() => {
    // Only init if API Key exists
    if (process.env.API_KEY) {
      initGemini();
      startChat(currentModel);
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
      const stream = sendMessageStream(text);
      
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
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "Sorry, I encountered an error processing your request. Please check the console or your API Key.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => ({ ...msg, isStreaming: false })));
    }
  };

  const handleModelChange = (model: GeminiModel) => {
    setCurrentModel(model);
    setMessages([]); // Clear history on model switch for simplicity
    setFiles([]);
    setActiveFile(null);
    startChat(model);
  };

  if (!process.env.API_KEY) {
      return (
          <div className="h-screen w-screen bg-ide-bg flex items-center justify-center text-white">
              <div className="p-8 border border-red-500 rounded bg-red-900/20 max-w-lg text-center">
                  <h1 className="text-2xl font-bold mb-4">Missing API Key</h1>
                  <p className="mb-4">Please provide <code className="bg-black/30 px-2 py-1 rounded">process.env.API_KEY</code> to run Trae-G.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="flex h-screen w-screen bg-ide-bg text-ide-text font-sans overflow-hidden">
      {/* Left: Chat Sidebar (Width 350px fixed for now) */}
      <div className="w-[380px] flex-shrink-0 h-full flex flex-col border-r border-ide-border">
        <ChatInterface 
          messages={messages}
          isLoading={isLoading}
          currentModel={currentModel}
          onSendMessage={handleSendMessage}
          onModelChange={handleModelChange}
        />
      </div>

      {/* Middle: File Explorer (Narrow) */}
      <div className="w-[200px] flex-shrink-0 h-full bg-ide-sidebar border-r border-ide-border hidden md:block">
        <FileExplorer 
          files={files} 
          activeFile={activeFile} 
          onSelectFile={setActiveFile} 
        />
      </div>

      {/* Right: Editor Workspace */}
      <div className="flex-1 h-full min-w-0 bg-[#1E1E1E]">
        <CodeEditor file={activeFile} />
      </div>
    </div>
  );
}

export default App;