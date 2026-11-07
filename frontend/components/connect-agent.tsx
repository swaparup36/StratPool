"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui";
import { send } from "@/lib/strategies";

function AgentDialog({ connected, onClose }: { connected: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => dialog.current?.showModal(), []);

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      await send("/api/mcp/token", "DELETE", "Failed to disconnect agents");
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect agents");
      setBusy(false);
    }
  }

  const config = JSON.stringify({ mcpServers: { stratpool: { type: "http", url: `${window.location.origin}/api/mcp` } } }, null, 2);

  return (
    <dialog
      ref={dialog}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border bg-surface text-fg backdrop:bg-black/60"
      aria-labelledby="agent-title"
      onClose={onClose}
    >
      <div className="grid gap-4 p-6">
        <h2 className="text-lg" id="agent-title">
          Connect an AI agent
        </h2>

        <p className="text-sm text-subtle">Add this server to your MCP client. It will send you to a page where you log in and approve the agent with your wallet.</p>
        <pre className="overflow-x-auto rounded-lg border p-3 text-xs">{config}</pre>

        {error && (
          <p className="text-sm break-words text-red-500" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {connected && (
            <button className={`${buttonClass("secondary")} disabled:opacity-60`} type="button" disabled={busy} onClick={disconnect}>
              Disconnect all agents
            </button>
          )}
          <button className={`${buttonClass()} disabled:opacity-60`} type="button" disabled={busy} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function ConnectAgent({ connected }: { connected: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={buttonClass("secondary")} type="button" onClick={() => setOpen(true)}>
        {connected ? "Agent connected" : "Connect agent"}
      </button>
      {open && <AgentDialog connected={connected} onClose={() => setOpen(false)} />}
    </>
  );
}
