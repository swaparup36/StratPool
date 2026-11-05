import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui";
import {
  ACTIONS,
  CHAINS,
  emptyAsset,
  INDICATORS,
  LOGIC_OPERATORS,
  OPERATORS,
  REFERENCE_TYPES,
  RISK_LEVELS,
  TIMEFRAMES,
  TRADING_TYPES,
  type AssetForm,
  type MetadataForm,
  type StrategyNode,
} from "./schema";

export const inputClass = "h-9 w-full rounded-lg border bg-surface px-3 text-sm placeholder:text-subtle";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (string | { value: string; label: string })[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const { value: optionValue, label: optionLabel } = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  onChange: (value: number | null) => void;
}) {
  return (
    <Field label={label}>
      <input
        className={inputClass}
        type="number"
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </Field>
  );
}

const operatorLabels = { GREATER_THAN: "Greater than", LESS_THAN: "Less than", CROSS_ABOVE: "Crosses above", CROSS_BELOW: "Crosses below" };

export function NodeConfig({ node, onChange }: { node: StrategyNode; onChange: (patch: Record<string, unknown>) => void }) {
  switch (node.type) {
    case "trigger":
      return (
        <SelectField label="Timeframe" value={node.data.timeframe} options={TIMEFRAMES} onChange={(timeframe) => onChange({ timeframe })} />
      );
    case "indicator":
      return (
        <>
          <SelectField label="Indicator" value={node.data.indicator} options={INDICATORS} onChange={(indicator) => onChange({ indicator })} />
          <NumberField label="Period" min={1} max={500} value={node.data.period} onChange={(period) => onChange({ period })} />
          <SelectField label="Timeframe" value={node.data.timeframe} options={TIMEFRAMES} onChange={(timeframe) => onChange({ timeframe })} />
        </>
      );
    case "condition": {
      const { data } = node;
      return (
        <>
          <SelectField
            label="Operator"
            value={data.operator}
            options={OPERATORS.map((value) => ({ value, label: operatorLabels[value] }))}
            onChange={(operator) => onChange({ operator })}
          />
          <SelectField
            label="Compare to"
            value={data.referenceType}
            options={REFERENCE_TYPES.map((value) => ({ value, label: value === "VALUE" ? "A fixed value" : "Another indicator" }))}
            onChange={(referenceType) => onChange({ referenceType, value: null })}
          />
          {data.referenceType === "VALUE" ? (
            <NumberField label="Value" value={data.value} onChange={(value) => onChange({ value })} />
          ) : (
            <p className="text-sm text-subtle">Connect one indicator to input A and the other to input B.</p>
          )}
        </>
      );
    }
    case "logic":
      return <SelectField label="Operator" value={node.data.operator} options={LOGIC_OPERATORS} onChange={(operator) => onChange({ operator })} />;
    case "action":
      return (
        <>
          <SelectField
            label="Action"
            value={node.data.action}
            options={ACTIONS}
            onChange={(action) => onChange({ action, percentage: action === "HOLD" ? null : (node.data.percentage ?? 100) })}
          />
          {node.data.action !== "HOLD" && (
            <NumberField
              label="Capital to allocate (%)"
              min={1}
              max={100}
              value={node.data.percentage}
              onChange={(percentage) => onChange({ percentage })}
            />
          )}
        </>
      );
  }
}

export function MetadataFields({
  value,
  onChange,
}: {
  value: MetadataForm;
  onChange: (patch: Partial<MetadataForm>) => void;
}) {
  const text = (key: "tradingPair" | "protocol" | "poolAddress", label: string, placeholder: string) => (
    <Field label={label}>
      <input
        className={inputClass}
        placeholder={placeholder}
        value={value[key] ?? ""}
        onChange={(e) => onChange({ [key]: e.target.value })}
      />
    </Field>
  );
  const assets = value.acceptedAssets;
  const setAsset = (index: number, patch: Partial<AssetForm>) =>
    onChange({ acceptedAssets: assets.map((asset, i) => (i === index ? { ...asset, ...patch } : asset)) });

  return (
    <>
      <Field label="Description">
        <textarea
          className={`${inputClass} h-24 resize-y py-2`}
          placeholder="What does this strategy do? Investors will see this."
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>
      <SelectField label="Chain" value={value.chain} options={CHAINS} onChange={(chain) => onChange({ chain: chain as MetadataForm["chain"] })} />
      <SelectField
        label="Trading type"
        value={value.tradingType}
        options={TRADING_TYPES}
        onChange={(tradingType) => onChange({ tradingType: tradingType as MetadataForm["tradingType"] })}
      />
      {text("tradingPair", "Trading pair", "ETH/USDC")}
      {text("protocol", "Protocol", "UNISWAP_V3")}
      {text("poolAddress", "Pool address (optional)", "0x…")}
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm text-muted">Accepted assets</legend>
        {assets.map((asset, index) => {
          const amount = (key: "minInvestment" | "maxInvestment", label: string, placeholder: string) => (
            <Field label={label}>
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder={placeholder}
                value={asset[key] ?? ""}
                onChange={(e) => setAsset(index, { [key]: e.target.value })}
              />
            </Field>
          );
          return (
            <div className="grid gap-2 rounded-lg border p-3" key={index}>
              <Field label="Token symbol">
                <input
                  className={inputClass}
                  placeholder="USDC"
                  value={asset.symbol}
                  onChange={(e) => setAsset(index, { symbol: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                {amount("minInvestment", "Min", "100")}
                {amount("maxInvestment", "Max (optional)", "10000")}
              </div>
              {assets.length > 1 && (
                <button
                  className={`${buttonClass("secondary", "sm")} justify-self-start`}
                  type="button"
                  onClick={() => onChange({ acceptedAssets: assets.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="size-3.5" aria-hidden /> Remove asset
                </button>
              )}
            </div>
          );
        })}
        <button
          className={`${buttonClass("secondary", "sm")} justify-self-start`}
          type="button"
          onClick={() => onChange({ acceptedAssets: [...assets, emptyAsset] })}
        >
          <Plus className="size-3.5" aria-hidden /> Add asset
        </button>
      </fieldset>
      <SelectField
        label="Risk level"
        value={value.riskLevel}
        options={RISK_LEVELS}
        onChange={(riskLevel) => onChange({ riskLevel: riskLevel as MetadataForm["riskLevel"] })}
      />
    </>
  );
}
