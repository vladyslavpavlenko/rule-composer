import { useState } from "react";
import { LuPlay, LuCirclePlay, LuPlus, LuSparkles, LuTrash2, LuFlaskConical, LuChevronDown } from "react-icons/lu";
import { Scenario } from "../lib/claude";

interface Props {
  scenarios: Scenario[];
  ruleName: string | null;
  onGenerateScenarios: (count: number) => void;
  generatingScenarios: boolean;
  hasSelectedRule: boolean;
  onRunAll: () => void;
  onRunSingle: (scenarioId: string) => void;
  onAddScenario: (scenario: { title: string; userMessage: string; expectation: string }) => void;
  onRemoveScenario: (scenarioId: string) => void;
}

const verdictColors = {
  pass: "bg-green-900/50 text-green-400",
  warn: "bg-yellow-900/50 text-yellow-400",
  fail: "bg-red-900/50 text-red-400",
};

const verdictDot = {
  pass: "bg-green-400",
  warn: "bg-yellow-400",
  fail: "bg-red-400",
};

const verdictLabel = { pass: "PASS", warn: "WARN", fail: "FAIL" };

function VerdictBadge({ verdict }: { verdict: "pass" | "warn" | "fail" }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${verdictColors[verdict]}`}>
      {verdictLabel[verdict]}
    </span>
  );
}

function AddScenarioForm({ onAdd, onCancel }: { onAdd: (s: { title: string; userMessage: string; expectation: string }) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [expectation, setExpectation] = useState("");

  const canSubmit = title.trim() && userMessage.trim() && expectation.trim();

  return (
    <div className="mb-3 rounded border border-neutral-700 bg-neutral-900 p-3">
      <div className="mb-2 text-xs font-medium text-neutral-300">New Scenario</div>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-2 w-full rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500/50"
      />
      <textarea
        placeholder="User message"
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        rows={2}
        className="mb-2 w-full rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500/50 resize-none"
      />
      <textarea
        placeholder="Expected behavior"
        value={expectation}
        onChange={(e) => setExpectation(e.target.value)}
        rows={2}
        className="mb-2 w-full rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500/50 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { if (canSubmit) onAdd({ title, userMessage, expectation }); }}
          disabled={!canSubmit}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="rounded px-3 py-1 text-xs text-neutral-400 hover:bg-white/[0.06]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CountDropdown({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const options = [1, 2, 3, 5, 8, 10];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 rounded px-2 py-2 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-300"
      >
        {value}
        <LuChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-white/[0.08] bg-neutral-900 shadow-lg p-1 min-w-[40px] flex flex-col gap-0.5">
          {options.map((n) => (
            <button
              key={n}
              onClick={() => { onChange(n); setOpen(false); }}
              className={`block w-full rounded-md px-3 py-1 text-xs text-left ${n === value ? "text-neutral-100 bg-white/[0.06]" : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScenarioRunner({
  scenarios,
  ruleName,
  onGenerateScenarios,
  generatingScenarios,
  hasSelectedRule,
  onRunAll,
  onRunSingle,
  onAddScenario,
  onRemoveScenario,
}: Props) {
  const [tab, setTab] = useState<"scenarios" | "analysis">("scenarios");
  const [showAddForm, setShowAddForm] = useState(false);
  const [genCount, setGenCount] = useState(3);

  const passCount = scenarios.filter((s) => s.verdict === "pass").length;
  const warnCount = scenarios.filter((s) => s.verdict === "warn").length;
  const failCount = scenarios.filter((s) => s.verdict === "fail").length;
  const totalRun = scenarios.filter((s) => s.verdict).length;

  const hasScenarios = scenarios.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 h-[38px] shrink-0">
        <LuFlaskConical size={13} className="text-neutral-500 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Scenarios
        </span>
        {hasScenarios && (
          <div className="flex gap-1 ml-1">
            <button
              onClick={() => setTab("scenarios")}
              className={`rounded px-2.5 py-1 text-xs ${
                tab === "scenarios"
                  ? "bg-neutral-700 text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setTab("analysis")}
              className={`rounded px-2.5 py-1 text-xs ${
                tab === "analysis"
                  ? "bg-neutral-700 text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Analysis
            </button>
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowAddForm(true)}
            disabled={!hasSelectedRule}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300 disabled:opacity-25 disabled:pointer-events-none"
            title="Add custom scenario"
          >
            <LuPlus size={14} />
          </button>
          <CountDropdown value={genCount} onChange={setGenCount} />
          <button
            onClick={() => onGenerateScenarios(genCount)}
            disabled={!hasSelectedRule || generatingScenarios}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300 disabled:opacity-25 disabled:pointer-events-none"
            title="Generate scenarios"
          >
            <LuSparkles size={14} />
          </button>
          <button
            onClick={onRunAll}
            disabled={!hasScenarios}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300 disabled:opacity-25 disabled:pointer-events-none"
            title="Run all scenarios"
          >
            <LuCirclePlay size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* No rule selected */}
        {!ruleName && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-neutral-600">Select a rule to view scenarios</p>
          </div>
        )}

        {/* Rule selected but no scenarios — show prominent actions */}
        {ruleName && !hasScenarios && !showAddForm && (
          <div className="flex flex-col items-center justify-center gap-3 h-full">
            <p className="text-xs text-neutral-600 mb-2">
              No scenarios for this rule yet
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onGenerateScenarios(genCount)}
                disabled={generatingScenarios}
                className="flex items-center gap-2 rounded bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-700 disabled:opacity-40"
              >
                <LuSparkles size={12} />
                {generatingScenarios ? "Generating…" : "Generate"}
              </button>
              <CountDropdown value={genCount} onChange={setGenCount} />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded px-4 py-2 text-xs text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300"
            >
              <LuPlus size={12} />
              Add manually
            </button>
          </div>
        )}

        {/* Scenario list tab */}
        {tab === "scenarios" && (
          <>
            {showAddForm && (
              <AddScenarioForm
                onAdd={(s) => { onAddScenario(s); setShowAddForm(false); }}
                onCancel={() => setShowAddForm(false)}
              />
            )}
            {scenarios.map((s) => (
              <div
                key={s.id}
                className="mb-3 rounded border border-neutral-800 bg-neutral-900 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-200 flex-1 min-w-0 truncate">
                    {s.title}
                  </span>
                  {s.loading && (
                    <span className="text-[10px] text-neutral-500 shrink-0">Running…</span>
                  )}
                  {s.verdict && <VerdictBadge verdict={s.verdict} />}
                  <button
                    onClick={() => onRunSingle(s.id)}
                    disabled={s.loading}
                    className="rounded-md p-1 text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300 disabled:opacity-25 disabled:pointer-events-none shrink-0"
                    title="Run scenario"
                  >
                    <LuPlay size={12} />
                  </button>
                  <button
                    onClick={() => onRemoveScenario(s.id)}
                    className="rounded-md p-1 text-neutral-500 hover:bg-white/[0.06] hover:text-red-400 shrink-0"
                    title="Remove scenario"
                  >
                    <LuTrash2 size={12} />
                  </button>
                </div>
                <div className="mb-1 text-xs text-neutral-500">User message:</div>
                <div className="mb-2 rounded bg-neutral-800 p-2 text-xs text-neutral-300">
                  {s.userMessage}
                </div>
                <div className="mb-1 text-xs text-neutral-500">
                  Expected behavior:
                </div>
                <div className="mb-2 text-xs text-neutral-400">{s.expectation}</div>
                {s.response && (
                  <>
                    <div className="mb-1 text-xs text-neutral-500">
                      Agent response:
                    </div>
                    <div className="mb-2 max-h-40 overflow-y-auto rounded bg-neutral-800 p-2 text-xs text-neutral-300">
                      {s.response}
                    </div>
                  </>
                )}
                {s.reason && (
                  <div className="text-xs text-neutral-400 italic">
                    {s.reason}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Analysis tab — clean summary */}
        {tab === "analysis" && (
          <div>
            {/* Summary line */}
            {totalRun > 0 && (
              <div className="mb-4 text-xs text-neutral-500">
                <span className="text-neutral-300 font-medium">{totalRun}</span> run
                {totalRun > 1 && (
                  <>
                    {" — "}
                    {passCount > 0 && <span className="text-green-400">{passCount} pass</span>}
                    {passCount > 0 && (warnCount > 0 || failCount > 0) && <span className="text-neutral-600">{" · "}</span>}
                    {warnCount > 0 && <span className="text-yellow-400">{warnCount} warn</span>}
                    {warnCount > 0 && failCount > 0 && <span className="text-neutral-600">{" · "}</span>}
                    {failCount > 0 && <span className="text-red-400">{failCount} fail</span>}
                  </>
                )}
              </div>
            )}

            {/* Results list */}
            <div className="space-y-1">
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-2.5 rounded px-2 py-1.5 hover:bg-white/[0.02]"
                >
                  {s.verdict ? (
                    <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${verdictDot[s.verdict]}`} />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-neutral-700" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs text-neutral-200 truncate">
                      {s.title}
                    </div>
                    {s.reason && (
                      <div className="text-[11px] text-neutral-500 mt-0.5">{s.reason}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Context consumption */}
            {totalRun > 0 && (
              <div className="mt-6 pt-4 border-t border-white/[0.04]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                  Context usage
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="text-neutral-500">
                      <td className="py-0.5">Scenarios tested</td>
                      <td className="py-0.5 text-right text-neutral-300">{totalRun}</td>
                    </tr>
                    <tr className="text-neutral-500">
                      <td className="py-0.5">API calls</td>
                      <td className="py-0.5 text-right text-neutral-300">{totalRun * 2}</td>
                    </tr>
                    <tr className="text-neutral-500">
                      <td className="py-0.5">Est. tokens per run</td>
                      <td className="py-0.5 text-right text-neutral-300">~400-600</td>
                    </tr>
                    <tr className="text-neutral-500">
                      <td className="py-0.5">Pass rate</td>
                      <td className="py-0.5 text-right text-neutral-300">
                        {totalRun > 0 ? `${Math.round((passCount / totalRun) * 100)}%` : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
