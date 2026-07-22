import { Message, VirtualFile } from "../types";

const SESSION_KEY = "arkaios_session_id";
const CHAT_KEY = "arkaios_chat_messages";
const MEMORY_KEY = "arkaios_long_memory";
const MAX_MESSAGES = 200;

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `arkaios-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages: Message[]) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  updateLongMemory(messages);
}

export function clearMemory() {
  localStorage.removeItem(CHAT_KEY);
  localStorage.removeItem(MEMORY_KEY);
}

export function getLongMemory() {
  return localStorage.getItem(MEMORY_KEY) || "";
}

function updateLongMemory(messages: Message[]) {
  const userMessages = messages.filter((msg) => msg.role === "user").slice(-30);
  const fileRequests = userMessages
    .filter((msg) => /(crea|crear|genera|generar|archivo|workspace|zip|github|terminal|powershell|wsl)/i.test(msg.content))
    .slice(-12)
    .map((msg) => `- ${new Date(msg.timestamp).toLocaleString()}: ${msg.content.slice(0, 180)}`)
    .join("\n");

  const memory = [
    `Sesion: ${getSessionId()}`,
    "Preferencias detectadas:",
    "- Responder en espanol latino, directo y pragmatico.",
    "- Si se piden archivos, crearlos en Workspace virtual usando bloques markdown con nombre.",
    "- No confundir Workspace virtual con disco local real.",
    fileRequests ? `Solicitudes relevantes recientes:\n${fileRequests}` : "",
  ].filter(Boolean).join("\n");

  localStorage.setItem(MEMORY_KEY, memory);
}

export function buildMemoryContext(messages: Message[]) {
  const longMemory = getLongMemory();
  const shortMemory = messages
    .slice(-12)
    .map((msg) => `${msg.role === "user" ? "Usuario" : "Arkaios"}: ${msg.content.slice(0, 800)}`)
    .join("\n");

  return [longMemory ? `Memoria larga local:\n${longMemory}` : "", shortMemory ? `Memoria corta de esta sesion:\n${shortMemory}` : ""]
    .filter(Boolean)
    .join("\n\n");
}

export function downloadChatLog(messages: Message[], files: VirtualFile[]) {
  const sessionId = getSessionId();
  const lines = [
    `ARKAIOS CHAT LOG`,
    `Session: ${sessionId}`,
    `Exported: ${new Date().toISOString()}`,
    "",
    "=== MEMORY ===",
    getLongMemory() || "(sin memoria larga)",
    "",
    "=== CHAT ===",
    ...messages.map((msg) => `[${new Date(msg.timestamp).toISOString()}] ${msg.role.toUpperCase()}\n${msg.content}\n`),
    "",
    "=== WORKSPACE VIRTUAL ===",
    ...files.map((file) => `- ${file.path || file.name} (${file.language})`),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sessionId}.log`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function saveRemoteMemory(userText: string, assistantText: string) {
  const content = [
    `Usuario: ${userText}`,
    `Arkaios: ${assistantText}`,
  ].join("\n");

  try {
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        sessionId: getSessionId(),
        content,
      }),
    });
  } catch {
    // La memoria remota es opcional. La memoria local ya queda guardada.
  }
}

export async function searchRemoteMemory(query: string) {
  try {
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "search",
        sessionId: getSessionId(),
        query,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return typeof data.context === "string" ? data.context : "";
  } catch {
    return "";
  }
}
