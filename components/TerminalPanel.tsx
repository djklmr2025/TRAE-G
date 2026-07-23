import React, { useEffect, useState } from "react";
import { Terminal, Play, Loader2, FolderPlus } from "lucide-react";
import { LocalShell, runLocalTerminal } from "../services/terminalService";
import { getWorkspaceStatus, setWorkspaceFolder } from "../services/workspaceService";

const TerminalPanel: React.FC = () => {
  const [shell, setShell] = useState<LocalShell>("powershell");
  const [command, setCommand] = useState("pwd");
  const [workspaceDir, setWorkspaceDir] = useState("C:\\ARKAIOS");
  const [output, setOutput] = useState("Terminal local Arkaios lista.\nUsa PowerShell, WSL/Linux o Termux/ADB cuando abras la app local.");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    getWorkspaceStatus()
      .then((status) => {
        setWorkspaceDir(status.workspaceDir);
        setOutput(`Terminal local Arkaios lista.\nWorkspace activo: ${status.workspaceDir}\nShells: PowerShell / WSL-Linux / Termux-ADB.`);
      })
      .catch(() => {
        setOutput("Terminal local no conectada.\nAbre TRAE-G.exe local; en Vercel no se puede tocar tu disco ni tu terminal real.");
      });
  }, []);

  const addFolderToWorkspace = async () => {
    const selected = window.prompt("Ruta local del workspace:", workspaceDir || "C:\\ARKAIOS");
    if (!selected) return;

    try {
      const status = await setWorkspaceFolder(selected);
      setWorkspaceDir(status.workspaceDir);
      setOutput((prev) => `${prev}\n\n[workspace] Carpeta activa: ${status.workspaceDir}`);
    } catch (error) {
      setOutput((prev) => `${prev}\n\n[workspace] ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const execute = async () => {
    const clean = command.trim();
    if (!clean || isRunning) return;

    setIsRunning(true);
    setOutput((prev) => `${prev}\n\n$ ${clean}\n`);

    try {
      const result = await runLocalTerminal(shell, clean);
      const text = [
        result.stdout?.trim(),
        result.stderr?.trim() ? `ERR:\n${result.stderr.trim()}` : "",
        `exit=${result.code ?? "null"} cwd=${result.cwd}`,
      ].filter(Boolean).join("\n");
      setOutput((prev) => `${prev}${text}`);
    } catch (error) {
      setOutput((prev) => `${prev}${error instanceof Error ? error.message : String(error)}\n\nNota: esta terminal solo funciona con el servidor local Arkaios, no en Vercel.`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#111318] border-t border-ide-border">
      <div className="h-10 px-3 flex items-center justify-between border-b border-ide-border">
        <div className="flex items-center gap-2 text-sm text-gray-200">
          <Terminal size={15} className="text-green-400" />
          <span>Terminal Local Arkaios</span>
          <span className="hidden md:inline text-[11px] text-gray-500 truncate max-w-[360px]">{workspaceDir}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addFolderToWorkspace}
            className="px-2 py-1 rounded border border-gray-700 hover:border-green-500 text-xs text-gray-200 flex items-center gap-1"
            title="Add Folder to Workspace local"
          >
            <FolderPlus size={13} />
            Add Folder
          </button>
          <select
            value={shell}
            onChange={(event) => setShell(event.target.value as LocalShell)}
            className="bg-[#1E1E1E] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
          >
            <option value="powershell">PowerShell</option>
            <option value="wsl">Linux / WSL</option>
            <option value="termux">Termux / ADB</option>
          </select>
        </div>
      </div>

      <pre className="flex-1 overflow-auto p-3 text-xs text-gray-300 whitespace-pre-wrap font-mono">
        {output}
      </pre>

      <div className="p-2 border-t border-ide-border flex gap-2">
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") execute();
          }}
          className="flex-1 bg-[#1E1E1E] border border-gray-700 rounded px-3 py-2 text-xs text-gray-100 outline-none focus:border-green-500"
          placeholder="Comando local..."
          disabled={isRunning}
        />
        <button
          onClick={execute}
          disabled={isRunning || !command.trim()}
          className="px-3 py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs flex items-center gap-2"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Ejecutar
        </button>
      </div>
    </div>
  );
};

export default TerminalPanel;
