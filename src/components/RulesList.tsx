import { useState } from "react";
import { LuTrafficCone, LuChevronDown } from "react-icons/lu";
import { Rule, AVAILABLE_MODELS, ModelId } from "../lib/claude";

interface Props {
  rules: Rule[];
  selectedRuleId: string | null;
  onSelect: (id: string) => void;
  model: ModelId;
  onModelChange: (model: ModelId) => void;
}

function ModelSelector({ value, onChange }: { value: ModelId; onChange: (m: ModelId) => void }) {
  const [open, setOpen] = useState(false);
  const current = AVAILABLE_MODELS.find((m) => m.id === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-300"
      >
        {current.label}
        <LuChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-white/[0.08] bg-neutral-900 shadow-lg p-1 min-w-[120px] flex flex-col gap-0.5">
          {AVAILABLE_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={`block w-full rounded-md px-3 py-1.5 text-xs text-left ${m.id === value ? "text-neutral-100 bg-white/[0.06]" : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RulesList({
  rules,
  selectedRuleId,
  onSelect,
  model,
  onModelChange,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 h-[38px] shrink-0">
        <LuTrafficCone size={13} className="text-neutral-500 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Rules
        </span>
        <div className="flex-1" />
        <ModelSelector value={model} onChange={onModelChange} />
        <span className="text-xs text-neutral-600">{rules.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 relative">
        {rules.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-neutral-600">Parse a prompt to extract rules</p>
          </div>
        )}
        {rules.map((rule, index) => (
          <button
            key={rule.id}
            onClick={() => onSelect(rule.id)}
            className={`mb-1 w-full rounded px-3 py-2 text-left text-sm flex gap-2 ${
              selectedRuleId === rule.id
                ? "bg-white/[0.06] text-neutral-100"
                : "text-neutral-300 hover:bg-white/[0.04]"
            }`}
          >
            <span className="text-neutral-600 text-xs pt-0.5 shrink-0">{index + 1}</span>
            <span>{rule.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
