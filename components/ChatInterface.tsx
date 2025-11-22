import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, GeminiModel } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  currentModel: GeminiModel;
  onSendMessage: (text: string) => void;
  onModelChange: (model: GeminiModel) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  currentModel, 
  onSendMessage,
  onModelChange
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const getModelName = (m: GeminiModel) => {
    if (m === GeminiModel.FLASH) return 'Gemini 2.5 Flash';
    if (m === GeminiModel.PRO) return 'Gemini 3.0 Pro';
    if (m === GeminiModel.THINKING) return 'Gemini 2.5 (Thinking)';
    return m;
  };

  return (
    <div className="h-full flex flex-col bg-ide-sidebar border-r border-ide-border">
      {/* Header */}
      <div className="p-4 border-b border-ide-border flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-google-blue to-purple-500 flex items-center justify-center text-white font-bold text-xs">
             TG
           </div>
           <h1 className="font-semibold text-white tracking-tight">Trae-G</h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-1 text-xs bg-ide-bg border border-ide-border px-2 py-1 rounded text-gray-300 hover:border-gray-500 transition-colors"
          >
            {getModelName(currentModel)}
            <ChevronDown size={12} />
          </button>
          
          {showModelMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#252529] border border-ide-border rounded-md shadow-xl z-50 overflow-hidden">
              {Object.values(GeminiModel).map((model) => (
                <button
                  key={model}
                  onClick={() => {
                    onModelChange(model);
                    setShowModelMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-google-blue hover:text-white transition-colors ${currentModel === model ? 'text-google-blue font-medium' : 'text-gray-400'}`}
                >
                  {getModelName(model)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4 opacity-60">
            <Sparkles size={48} className="text-google-yellow" />
            <div>
              <p className="text-sm font-medium text-gray-300">Welcome to Trae-G</p>
              <p className="text-xs mt-1">Powered by Google Gemini</p>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-700' : 'bg-google-blue/20 text-google-blue'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`flex-1 max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-[#2B2D31] text-gray-100' 
                : 'bg-transparent text-gray-300'
            }`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-[#0F1115] prose-pre:border prose-pre:border-gray-800">
                  <ReactMarkdown 
                     components={{
                        code({node, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '')
                          const isInline = !match;
                          if (isInline) {
                             return <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200" {...props}>{children}</code>
                          }
                          return null; // We hide code blocks in chat to avoid clutter, or simplify them
                        }
                     }}
                  >
                    {msg.content.replace(/```[\s\S]*?```/g, '_[Code Generated - See Editor]_')} 
                    {/* Simple trick to hide large code blocks in chat, forcing user to look at editor */}
                  </ReactMarkdown>
                  <div className="text-xs text-gray-500 mt-2 border-t border-gray-800 pt-2 flex gap-2 items-center">
                    <Sparkles size={10} className="text-google-blue" /> 
                    <span>Trae-G generated content</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-google-blue/20 flex items-center justify-center text-google-blue">
              <Bot size={16} />
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm p-3">
              <Loader2 size={14} className="animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-ide-border bg-ide-sidebar">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Trae to generate code..."
            className="w-full bg-[#2B2D31] text-gray-200 text-sm rounded-md pl-4 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-google-blue border border-transparent placeholder-gray-500"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
        <div className="mt-2 text-[10px] text-gray-600 text-center">
          Gemini can make mistakes. Review code before use.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;