import { useState } from "react";
import { generateScenarios, runScenario, Scenario } from "../lib/claude";
import { showToast, dismissToast } from "../components/Toast";

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Record<string, Scenario[]>>({});
  const [loading, setLoading] = useState(false);

  const generate = async (apiKey: string, ruleId: string, ruleText: string, count: number = 3, model?: string) => {
    setLoading(true);
    const toastId = showToast("loading", "Generating test scenarios…");
    try {
      const sc = await generateScenarios(apiKey, ruleText, count, model);
      setScenarios((prev) => ({ ...prev, [ruleId]: [...(prev[ruleId] ?? []), ...sc] }));
      dismissToast(toastId);
      showToast("info", `Generated ${sc.length} scenarios`);
    } catch (e: any) {
      dismissToast(toastId);
      showToast("error", `Generation failed: ${e.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const runSingle = async (
    apiKey: string,
    systemPrompt: string,
    ruleId: string,
    ruleText: string,
    scenarioId: string,
    model?: string
  ) => {
    const ruleScenarios = scenarios[ruleId];
    if (!ruleScenarios) return;
    const idx = ruleScenarios.findIndex((s) => s.id === scenarioId);
    if (idx === -1) return;

    setScenarios((prev) => {
      const updated = [...(prev[ruleId] ?? [])];
      updated[idx] = { ...updated[idx], loading: true };
      return { ...prev, [ruleId]: updated };
    });

    const toastId = showToast("loading", `Running scenario: ${ruleScenarios[idx].title}…`);
    try {
      const result = await runScenario(
        apiKey,
        systemPrompt,
        ruleScenarios[idx],
        ruleText,
        model
      );
      setScenarios((prev) => {
        const updated = [...(prev[ruleId] ?? [])];
        updated[idx] = { ...updated[idx], ...result, loading: false };
        return { ...prev, [ruleId]: updated };
      });
      dismissToast(toastId);
    } catch (e: any) {
      setScenarios((prev) => {
        const updated = [...(prev[ruleId] ?? [])];
        updated[idx] = {
          ...updated[idx],
          verdict: "fail",
          reason: e.toString(),
          loading: false,
        };
        return { ...prev, [ruleId]: updated };
      });
      dismissToast(toastId);
      showToast("error", `Scenario failed: ${e.toString()}`);
    }
  };

  const run = async (
    apiKey: string,
    systemPrompt: string,
    ruleId: string,
    ruleText: string,
    model?: string
  ) => {
    const ruleScenarios = scenarios[ruleId];
    if (!ruleScenarios) return;

    for (const scenario of ruleScenarios) {
      await runSingle(apiKey, systemPrompt, ruleId, ruleText, scenario.id, model);
    }
  };

  const runAll = async (
    apiKey: string,
    systemPrompt: string,
    rules: { id: string; text: string }[],
    model?: string
  ) => {
    for (const rule of rules) {
      if (scenarios[rule.id]?.length) {
        await run(apiKey, systemPrompt, rule.id, rule.text, model);
      }
    }
  };

  const addScenario = (ruleId: string, scenario: { title: string; userMessage: string; expectation: string }) => {
    const newScenario: Scenario = {
      id: `scenario-custom-${Date.now()}`,
      ...scenario,
    };
    setScenarios((prev) => ({
      ...prev,
      [ruleId]: [...(prev[ruleId] ?? []), newScenario],
    }));
  };

  const removeScenario = (ruleId: string, scenarioId: string) => {
    setScenarios((prev) => ({
      ...prev,
      [ruleId]: (prev[ruleId] ?? []).filter((s) => s.id !== scenarioId),
    }));
  };

  return { scenarios, loading, generate, run, runAll, runSingle, addScenario, removeScenario };
}
