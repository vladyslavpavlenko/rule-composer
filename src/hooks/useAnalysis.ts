import { useState } from "react";
import { analyzePrompt, PromptIssue } from "../lib/claude";
import { showToast, dismissToast } from "../components/Toast";

export function useAnalysis() {
  const [issues, setIssues] = useState<PromptIssue[]>([]);
  const [loading, setLoading] = useState(false);

  const analyze = async (apiKey: string, prompt: string, model?: string) => {
    setLoading(true);
    const toastId = showToast("loading", "Analyzing prompt…");
    try {
      const result = await analyzePrompt(apiKey, prompt, model);
      setIssues(result);
      dismissToast(toastId);
      if (result.length === 0) {
        showToast("info", "Prompt looks clean — no issues found");
      } else {
        showToast("info", `Found ${result.length} issue${result.length > 1 ? "s" : ""}`);
      }
    } catch (e: any) {
      dismissToast(toastId);
      showToast("error", `Analysis failed: ${e.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const clearIssues = () => setIssues([]);

  const removeIssue = (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  return { issues, loading, analyze, clearIssues, removeIssue };
}
