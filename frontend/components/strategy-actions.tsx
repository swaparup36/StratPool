"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SaveStatus } from "@/components/strategy-builder/schema";
import { buttonClass } from "@/components/ui";
import { deleteStrategy, setStrategyStatus } from "@/lib/strategies";

function DeleteDialog({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => dialog.current?.showModal(), []);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteStrategy(id);
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete strategy");
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border bg-surface text-fg backdrop:bg-black/60"
      aria-labelledby={`delete-title-${id}`}
      aria-describedby={`delete-text-${id}`}
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      // Browsers can force an Esc close past onCancel, so reopen until the delete has finished.
      onClose={() => (busy ? dialog.current?.showModal() : onClose())}
      // The panel fills the dialog, so a click landing on the dialog itself is on the backdrop.
      onClick={(e) => {
        if (e.target === dialog.current && !busy) onClose();
      }}
    >
      <div className="grid gap-5 p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-full bg-red-500/10 text-red-500">
            <TriangleAlert className="size-5" aria-hidden />
          </span>
          <div className="grid min-w-0 gap-1">
            <h2 className="text-lg" id={`delete-title-${id}`}>
              Delete strategy?
            </h2>
            <p className="text-sm break-words text-muted" id={`delete-text-${id}`}>
              <span className="text-fg">{name}</span> and its accepted assets will be permanently deleted. This can&apos;t be undone.
            </p>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button className={`${buttonClass("secondary")} disabled:opacity-60`} type="button" autoFocus disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className={`${buttonClass("danger")} disabled:opacity-60`} type="button" disabled={busy} onClick={confirm}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function StrategyActions({ id, name, status }: { id: string; name: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const nextStatus: SaveStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  const disabled = `${buttonClass("secondary", "sm")} disabled:opacity-60`;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link className={buttonClass("secondary", "sm")} href={`/strategies/edit/${id}`}>
          Edit
        </Link>
        <button className={disabled} type="button" disabled={busy} onClick={() => run(() => setStrategyStatus(id, nextStatus))}>
          {nextStatus === "PUBLISHED" ? "Publish" : "Take down"}
        </button>
        <button className={`${disabled} text-red-500`} type="button" disabled={busy} onClick={() => setConfirmingDelete(true)}>
          Delete
        </button>
      </div>
      {confirmingDelete && <DeleteDialog id={id} name={name} onClose={() => setConfirmingDelete(false)} />}
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
