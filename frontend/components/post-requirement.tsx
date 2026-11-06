"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field, inputClass, SelectField } from "@/components/strategy-builder/config-panel";
import { CHAINS, RISK_LEVELS, TRADING_TYPES, type Chain } from "@/components/strategy-builder/schema";
import { buttonClass } from "@/components/ui";
import { createRequirement, DURATION_TYPES, DURATION_UNITS, type RequirementForm } from "@/lib/requirements";

function RequirementDialog({ defaultChain, onClose }: { defaultChain?: Chain; onClose: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: "",
    asset: "",
    chain: defaultChain ?? "SEPOLIA",
    tradingType: "SPOT",
    tradingPairs: "",
    riskLevel: "MEDIUM",
    durationType: "FLEXIBLE",
    durationValue: "",
    durationUnit: "DAYS",
  });
  const set = (changes: Partial<typeof form>) => setForm((current) => ({ ...current, ...changes }));
  const fixed = form.durationType === "FIXED";

  useEffect(() => dialog.current?.showModal(), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // the server validates and narrows these values
      await createRequirement({
        ...form,
        tradingPairs: form.tradingPairs.split(",").map((pair) => pair.trim()).filter(Boolean),
        durationValue: fixed ? Number(form.durationValue) : null,
        durationUnit: fixed ? form.durationUnit : null,
      } as RequirementForm);
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post requirement");
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border bg-surface text-fg backdrop:bg-black/60"
      aria-labelledby="requirement-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      // browsers can force an Esc close past onCancel, so reopen until the post has finished
      onClose={() => (busy ? dialog.current?.showModal() : onClose())}
    >
      <form className="grid gap-4 p-6" onSubmit={submit}>
        <h2 className="text-lg" id="requirement-title">
          Post a requirement
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount">
            <input className={inputClass} inputMode="decimal" autoComplete="off" placeholder="100" required value={form.amount} onChange={(e) => set({ amount: e.target.value })} />
          </Field>
          <Field label="Asset">
            <input className={inputClass} autoComplete="off" placeholder="USDC" required value={form.asset} onChange={(e) => set({ asset: e.target.value })} />
          </Field>
          <SelectField label="Chain" value={form.chain} options={CHAINS} onChange={(chain) => set({ chain: chain as Chain })} />
          <SelectField label="Trading type" value={form.tradingType} options={TRADING_TYPES} onChange={(tradingType) => set({ tradingType })} />
        </div>

        <Field label="Trading pairs (comma separated)">
          <input
            className={inputClass}
            autoComplete="off"
            placeholder="ETH/USDC, WBTC/USDC"
            required
            value={form.tradingPairs}
            onChange={(e) => set({ tradingPairs: e.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Risk level" value={form.riskLevel} options={RISK_LEVELS} onChange={(riskLevel) => set({ riskLevel })} />
          <SelectField label="Duration" value={form.durationType} options={DURATION_TYPES} onChange={(durationType) => set({ durationType })} />
          {fixed && (
            <>
              <Field label="Duration length">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={3650}
                  step={1}
                  required
                  value={form.durationValue}
                  onChange={(e) => set({ durationValue: e.target.value })}
                />
              </Field>
              <SelectField label="Duration unit" value={form.durationUnit} options={DURATION_UNITS} onChange={(durationUnit) => set({ durationUnit })} />
            </>
          )}
        </div>

        {error && (
          <p className="text-sm break-words text-red-500" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button className={`${buttonClass("secondary")} disabled:opacity-60`} type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className={`${buttonClass()} disabled:opacity-60`} type="submit" disabled={busy}>
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function PostRequirement({ defaultChain }: { defaultChain?: Chain }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={buttonClass()} type="button" onClick={() => setOpen(true)}>
        Post requirement
      </button>
      {open && <RequirementDialog defaultChain={defaultChain} onClose={() => setOpen(false)} />}
    </>
  );
}
