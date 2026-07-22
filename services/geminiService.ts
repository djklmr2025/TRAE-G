import { GeminiModel } from "../types";

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat?: (message: string, options?: Record<string, unknown>) => Promise<unknown>;
      };
    };
  }
}

let initialized = false;
let modelId: string | undefined;

export const initGemini = () => {
  modelId = process.env.ARKAIOS_MODEL_ID || "arkaios";
  initialized = true;
  return { modelId };
};

export const startChat = (_model: GeminiModel) => {
  if (!initialized) initGemini();
  if (!initialized) throw new Error("AI Service not initialized");
  return { modelId };
};

export const sendMessageStream = async function* (message: string) {
  if (!initialized) throw new Error("Chat session not started");

  const puterResponse = await tryPuterChat(message);
  if (puterResponse) {
    yield* yieldChunks(puterResponse);
    return;
  }

  const url = `/api/chat`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const body = {
    model: modelId,
    messages: [{ role: "user", content: message }],
    temperature: 0.3,
  };

  let data: any;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Arkaios no pudo responder: ${res.status} ${text}`);
  }
  data = await res.json();

  const fullText =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    data?.result?.note ||
    data?.result?.content ||
    data?.result ||
    "";

  yield* yieldChunks(fullText);
};

async function tryPuterChat(message: string): Promise<string | null> {
  if (!window.puter?.ai?.chat) return null;

  try {
    const response = await window.puter.ai.chat(message);
    if (typeof response === "string") return response;
    if (response && typeof response === "object") {
      const data = response as any;
      return (
        data.message?.content ||
        data.choices?.[0]?.message?.content ||
        data.text ||
        data.content ||
        JSON.stringify(data)
      );
    }
    return response ? String(response) : null;
  } catch (error) {
    console.warn("Puter AI no respondió; usando fallback Arkaios si está disponible.", error);
    return null;
  }
}

async function* yieldChunks(fullText: string) {
  const chunkSize = 240;
  for (let i = 0; i < fullText.length; i += chunkSize) {
    yield fullText.slice(i, i + chunkSize);
  }
}
