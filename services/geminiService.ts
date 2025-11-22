import { GoogleGenAI, Chat } from "@google/genai";
import { GeminiModel } from "../types";

// Helper to manage the AI instance
let aiInstance: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const SYSTEM_INSTRUCTION = `You are Trae-G, an elite AI coding assistant created by Google. 
Your goal is to generate high-quality, production-ready code. 
When providing code, ALWAYS wrap it in markdown code blocks. 
Ideally, specify the filename in the code block header if possible, or in a comment on the first line.
Example: 
\`\`\`typescript:src/app.ts
console.log("Hello");
\`\`\`
Be concise in explanations but thorough in code generation. Use modern best practices.`;

export const initGemini = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

export const startChat = (model: GeminiModel) => {
  if (!aiInstance) initGemini();
  if (!aiInstance) throw new Error("AI Service not initialized");

  // Handle thinking config mapping
  let actualModel = model;
  let config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
  };

  if (model === GeminiModel.THINKING) {
    actualModel = 'gemini-2.5-flash' as any;
    config = {
        ...config,
        thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking
    };
  }

  chatSession = aiInstance.chats.create({
    model: actualModel as string,
    config,
  });

  return chatSession;
};

export const sendMessageStream = async function* (message: string) {
  if (!chatSession) {
    throw new Error("Chat session not started");
  }

  const result = await chatSession.sendMessageStream({ message });
  
  for await (const chunk of result) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
};