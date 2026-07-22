import { VirtualFile } from "../types";

const encoder = new TextEncoder();

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(out: number[], value: number) {
  out.push(value & 0xff, (value >>> 8) & 0xff);
}

function write32(out: number[], value: number) {
  out.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function dosDateTime(date = new Date()) {
  const time =
    (date.getSeconds() >> 1) |
    (date.getMinutes() << 5) |
    (date.getHours() << 11);
  const dosDate =
    date.getDate() |
    ((date.getMonth() + 1) << 5) |
    ((date.getFullYear() - 1980) << 9);
  return { time, dosDate };
}

function normalizePath(file: VirtualFile) {
  const raw = file.path || file.name || "archivo.txt";
  return raw.replace(/^\/+/, "").replace(/\\/g, "/").replace(/\.\./g, "_");
}

export function createWorkspaceZip(files: VirtualFile[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const now = dosDateTime();

  for (const file of files) {
    const nameBytes = encoder.encode(normalizePath(file));
    const data = encoder.encode(file.content || "");
    const crc = crc32(data);

    const local: number[] = [];
    write32(local, 0x04034b50);
    write16(local, 20);
    write16(local, 0);
    write16(local, 0);
    write16(local, now.time);
    write16(local, now.dosDate);
    write32(local, crc);
    write32(local, data.length);
    write32(local, data.length);
    write16(local, nameBytes.length);
    write16(local, 0);
    localParts.push(new Uint8Array(local), nameBytes, data);

    const central: number[] = [];
    write32(central, 0x02014b50);
    write16(central, 20);
    write16(central, 20);
    write16(central, 0);
    write16(central, 0);
    write16(central, now.time);
    write16(central, now.dosDate);
    write32(central, crc);
    write32(central, data.length);
    write32(central, data.length);
    write16(central, nameBytes.length);
    write16(central, 0);
    write16(central, 0);
    write16(central, 0);
    write16(central, 0);
    write32(central, 0);
    write32(central, offset);
    centralParts.push(new Uint8Array(central), nameBytes);

    offset += local.length + nameBytes.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end: number[] = [];
  write32(end, 0x06054b50);
  write16(end, 0);
  write16(end, 0);
  write16(end, files.length);
  write16(end, files.length);
  write32(end, centralSize);
  write32(end, offset);
  write16(end, 0);

  return new Blob([...localParts, ...centralParts, new Uint8Array(end)], { type: "application/zip" });
}

export function downloadWorkspaceZip(files: VirtualFile[], name = "arkaios-workspace.zip") {
  if (files.length === 0) throw new Error("No hay archivos virtuales para exportar.");
  const blob = createWorkspaceZip(files);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toBase64Unicode(value: string) {
  const bytes = encoder.encode(value);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

export async function publishWorkspaceToGitHub(files: VirtualFile[]) {
  if (files.length === 0) throw new Error("No hay archivos virtuales para publicar.");

  const token = window.prompt("GitHub token temporal (fine-grained con permisos Contents/Repository). No se guarda.");
  if (!token) return "Publicacion cancelada: falta autorizacion de GitHub.";

  const repoName = window.prompt("Nombre del nuevo repositorio GitHub:", `arkaios-workspace-${Date.now()}`);
  if (!repoName) return "Publicacion cancelada: falta nombre de repositorio.";

  const visibility = window.confirm("Aceptar = repo privado. Cancelar = repo publico.") ? "private" : "public";

  const createRepo = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      name: repoName,
      private: visibility === "private",
      auto_init: true,
      description: "Workspace virtual exportado desde Arkaios.",
    }),
  });

  const repoData = await createRepo.json();
  if (!createRepo.ok) {
    throw new Error(repoData?.message || "GitHub no pudo crear el repositorio.");
  }

  const owner = repoData.owner?.login;
  const repo = repoData.name;

  for (const file of files) {
    const filePath = normalizePath(file);
    const upload = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        message: `Add ${filePath}`,
        content: toBase64Unicode(file.content || ""),
      }),
    });
    const uploadData = await upload.json();
    if (!upload.ok) {
      throw new Error(uploadData?.message || `GitHub no pudo subir ${filePath}.`);
    }
  }

  return repoData.html_url || `https://github.com/${owner}/${repo}`;
}
