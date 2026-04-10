import { useState } from "react";
import { parseRules, Rule } from "../lib/claude";
import { showToast, dismissToast } from "../components/Toast";

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parse = async (apiKey: string, prompt: string, label: string, model?: string) => {
    setLoading(true);
    const toastId = showToast("loading", `Parsing "${label}"…`);
    try {
      const parsed = await parseRules(apiKey, prompt, model);
      setRules(parsed);
      setSelectedRuleId(null);
      dismissToast(toastId);
      showToast("info", `"${label}" — extracted ${parsed.length} rules`);
    } catch (e: any) {
      dismissToast(toastId);
      showToast("error", `Parse failed for "${label}": ${e.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedRule = rules.find((r) => r.id === selectedRuleId) ?? null;

  return { rules, selectedRule, selectedRuleId, setSelectedRuleId, loading, parse };
}
