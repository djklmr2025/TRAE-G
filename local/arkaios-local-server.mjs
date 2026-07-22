import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const workspaceDir = process.env.ARKAIOS_WORKSPACE || "C:\\ARKAIOS";
const port = Number(process.env.ARKAIOS_LOCAL_PORT || 8787);

loadDotEnv(path.join(rootDir, ".env.local"));

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Payload demasiado grande"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function handleChat(req, res) {
  const body = await readJson(req);
  const apiKey = process.env.TRAE_PROXY_API_KEY || process.env.PROXY_API_KEY || process.env.ARKAIOS_API_KEY;
  const baseUrl = (process.env.ARKAIOS_BASE_URL || "https://arkaios-service-proxy.onrender.com").replace(/\/+$/, "");

  if (!apiKey) return sendJson(res, 500, { error: "Falta TRAE_PROXY_API_KEY/PROXY_API_KEY local" });

  const upstream = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: body.model || process.env.ARKAIOS_MODEL_ID || "arkaios",
      messages: body.messages || [],
      temperature: body.temperature ?? 0.3,
    }),
  });

  const text = await upstream.text();
  res.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || "application/json" });
  res.end(text);
}

async function handleTerminal(req, res) {
  const body = await readJson(req);
  const shell = body.shell === "wsl" ? "wsl" : "powershell";
  const command = String(body.command || "").trim();

  if (!command) return sendJson(res, 400, { error: "Comando vacío" });

  const child = shell === "wsl"
    ? spawn("wsl.exe", ["bash", "-lc", command], { cwd: workspaceDir, windowsHide: true })
    : spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], { cwd: workspaceDir, windowsHide: true });

  let stdout = "";
  let stderr = "";
  const timer = setTimeout(() => child.kill("SIGTERM"), 30000);

  child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  child.on("close", (code) => {
    clearTimeout(timer);
    sendJson(res, 200, { ok: code === 0, shell, cwd: workspaceDir, stdout, stderr, code });
  });
  child.on("error", (error) => {
    clearTimeout(timer);
    sendJson(res, 500, { ok: false, shell, cwd: workspaceDir, stdout, stderr: error.message, code: null });
  });
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const rawPath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  const candidate = path.resolve(distDir, rawPath.replace(/^\/+/, ""));
  const filePath = candidate.startsWith(distDir) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(distDir, "index.html");

  const ext = path.extname(filePath).toLowerCase();
  const type = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
  }[ext] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/chat") return await handleChat(req, res);
    if (req.method === "POST" && req.url === "/api/terminal/run") return await handleTerminal(req, res);
    if (req.method === "GET") return serveStatic(req, res);
    return sendJson(res, 405, { error: "Método no permitido" });
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Arkaios local listo: http://127.0.0.1:${port}`);
});
