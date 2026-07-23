export type LocalShell = "powershell" | "wsl" | "termux";

export type TerminalRunResult = {
  ok: boolean;
  shell: LocalShell;
  cwd: string;
  stdout: string;
  stderr: string;
  code: number | null;
};

export async function runLocalTerminal(shell: LocalShell, command: string): Promise<TerminalRunResult> {
  const response = await fetch("/api/terminal/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shell, command }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Terminal local no disponible (${response.status})`);
  }

  return data as TerminalRunResult;
}
