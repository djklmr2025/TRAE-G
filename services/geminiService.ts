import { GeminiModel } from "../types";

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
    throw new Error(`Arkaios request failed: ${res.status} ${text}`);
  }
  data = await res.json();

  const fullText =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    data?.result?.note ||
    data?.result?.content ||
    data?.result ||
    "";

  const chunkSize = 240;
  for (let i = 0; i < fullText.length; i += chunkSize) {
    yield fullText.slice(i, i + chunkSize);
  }
};
