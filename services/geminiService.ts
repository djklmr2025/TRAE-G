import { GeminiModel } from "../types";

let initialized = false;
let baseUrl: string | undefined;
let apiKey: string | undefined;
let modelId: string | undefined;

export const initGemini = () => {
  apiKey = process.env.ARKAIOS_API_KEY || process.env.API_KEY;
  baseUrl = process.env.ARKAIOS_BASE_URL || "http://localhost:4001";
  modelId = process.env.ARKAIOS_MODEL_ID || "arkaios";
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }
  initialized = true;
  return { baseUrl, apiKey, modelId };
};

export const startChat = (_model: GeminiModel) => {
  if (!initialized) initGemini();
  if (!initialized) throw new Error("AI Service not initialized");
  return { baseUrl, apiKey, modelId };
};

export const sendMessageStream = async function* (message: string) {
  if (!initialized) throw new Error("Chat session not started");

  const url = `${baseUrl}/v1/chat/completions`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const body = {
    model: modelId,
    messages: [{ role: "user", content: message }],
    temperature: 0.3,
  };

  let data: any;
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error("primary_failed");
    data = await res.json();
  } catch (_) {
    const fallbackUrl = `https://arkaios-gateway-open.onrender.com/v1/chat/completions`;
    const res2 = await fetch(fallbackUrl, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res2.ok) {
      const text = await res2.text();
      throw new Error(`Arkaios request failed: ${res2.status} ${text}`);
    }
    data = await res2.json();
  }

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
