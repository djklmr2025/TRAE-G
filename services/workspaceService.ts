export type WorkspaceStatus = {
  ok: boolean;
  local: boolean;
  workspaceDir: string;
  exists?: boolean;
  error?: string;
};

export async function getWorkspaceStatus(): Promise<WorkspaceStatus> {
  const response = await fetch("/api/workspace/status");
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Workspace local no disponible (${response.status})`);
  return data as WorkspaceStatus;
}

export async function setWorkspaceFolder(folderPath: string): Promise<WorkspaceStatus> {
  const response = await fetch("/api/workspace/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: folderPath }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `No se pudo agregar carpeta (${response.status})`);
  return data as WorkspaceStatus;
}
