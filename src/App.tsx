import { useState, useEffect, useCallback, useRef } from "react";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import PromptEditor from "./components/PromptEditor";
import RulesList from "./components/RulesList";
import ScenarioRunner from "./components/ScenarioRunner";
import SettingsModal from "./components/SettingsModal";
import UserMenu from "./components/UserMenu";
import TabBar, { Tab } from "./components/TabBar";
import ResizablePanels from "./components/ResizablePanels";
import ToastContainer, { showToast } from "./components/Toast";
import StatusBar from "./components/StatusBar";
import { useRules } from "./hooks/useRules";
import { useScenarios } from "./hooks/useScenarios";
import { useAnalysis } from "./hooks/useAnalysis";
import { getApiKey, setApiKey, ModelId, PromptIssue } from "./lib/claude";

interface TabState {
  id: string;
  title: string;
  content: string;
  filePath: string | null;
  dirty: boolean;
}

let nextTabId = 1;
function makeTab(title?: string, content?: string, filePath?: string | null): TabState {
  const id = `tab-${nextTabId++}`;
  return {
    id,
    title: title ?? "Untitled",
    content: content ?? "",
    filePath: filePath ?? null,
    dirty: false,
  };
}

function fileNameFromPath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

export default function App() {
  // --- Tabs ---
  const [tabs, setTabs] = useState<TabState[]>([makeTab()]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const updateActiveTab = useCallback(
    (patch: Partial<TabState>) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, ...patch } : t))
      );
    },
    [activeTabId]
  );

  const handleNewTab = () => {
    const t = makeTab();
    setTabs((prev) => [...prev, t]);
    setActiveTabId(t.id);
  };

  const handleCloseTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const t = makeTab();
        setActiveTabId(t.id);
        return [t];
      }
      if (activeTabId === id) {
        const idx = prev.findIndex((t) => t.id === id);
        const newActive = next[Math.min(idx, next.length - 1)];
        setActiveTabId(newActive.id);
      }
      return next;
    });
  };

  const handleOpenFile = async () => {
    const path = await openDialog({
      filters: [
        { name: "Prompt files", extensions: ["cursorrules", "mdc", "txt"] },
      ],
    });
    if (path) {
      const content = await readTextFile(path);
      const title = fileNameFromPath(path);
      // If active tab is empty and untitled, reuse it
      if (!activeTab.content && !activeTab.filePath) {
        updateActiveTab({ title, content, filePath: path, dirty: false });
      } else {
        const t = makeTab(title, content, path);
        setTabs((prev) => [...prev, t]);
        setActiveTabId(t.id);
      }
    }
  };

  const handleSaveFile = async () => {
    let path = activeTab.filePath;
    if (!path) {
      const chosen = await saveDialog({
        filters: [
          { name: "Prompt files", extensions: ["cursorrules", "mdc", "txt"] },
        ],
      });
      if (!chosen) return;
      path = chosen;
    }
    await writeTextFile(path, activeTab.content);
    updateActiveTab({
      filePath: path,
      title: fileNameFromPath(path),
      dirty: false,
    });
    showToast("info", `Saved ${fileNameFromPath(path)}`);
  };

  const handleContentChange = (content: string) => {
    updateActiveTab({ content, dirty: true });
  };

  // --- API Key ---
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    getApiKey().then((key) => {
      setApiKeyState(key);
    });
  }, []);

  const handleSaveKey = async (key: string) => {
    await setApiKey(key);
    setApiKeyState(key);
    setSettingsOpen(false);
    showToast("info", "API key saved to keychain");
  };

  // --- Model ---
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-20250514");

  // --- Rules & Scenarios ---
  const {
    rules,
    selectedRule,
    selectedRuleId,
    setSelectedRuleId,
    loading: parsingRules,
    parse,
  } = useRules();

  const {
    scenarios,
    loading: generatingScenarios,
    generate,
    runAll,
    runSingle,
    addScenario,
    removeScenario,
  } = useScenarios();

  const { issues, loading: analyzingPrompt, analyze, clearIssues, removeIssue } = useAnalysis();

  const handleAnalyze = () => {
    if (apiKey) analyze(apiKey, activeTab.content, model);
  };

  const handleApplyIssue = (issue: PromptIssue) => {
    const content = activeTab.content;
    const idx = content.indexOf(issue.quote);
    if (idx === -1) return;
    const newContent = content.slice(0, idx) + issue.replacement + content.slice(idx + issue.quote.length);
    handleContentChange(newContent);
    removeIssue(issue.id);
  };

  // Track the content that was last parsed, so Parse Rules can be disabled when nothing changed
  const lastParsedContent = useRef<string | null>(null);
  const lastParsedModel = useRef<string | null>(null);

  const handleParse = () => {
    if (apiKey) {
      lastParsedContent.current = activeTab.content;
      lastParsedModel.current = model;
      parse(apiKey, activeTab.content, activeTab.title, model);
    }
  };

  const parseDisabled =
    !activeTab.content.trim() ||
    (activeTab.content === lastParsedContent.current && model === lastParsedModel.current);

  const handleGenerateScenarios = (count: number) => {
    if (apiKey && selectedRule) {
      generate(apiKey, selectedRule.id, selectedRule.text, count, model);
    }
  };

  const handleRunAll = () => {
    if (apiKey) runAll(apiKey, activeTab.content, rules, model);
  };

  const handleRunSingle = (scenarioId: string) => {
    if (apiKey && selectedRule) {
      runSingle(apiKey, activeTab.content, selectedRule.id, selectedRule.text, scenarioId, model);
    }
  };

  const handleAddScenario = (scenario: { title: string; userMessage: string; expectation: string }) => {
    if (selectedRuleId) {
      addScenario(selectedRuleId, scenario);
    }
  };

  const handleRemoveScenario = (scenarioId: string) => {
    if (selectedRuleId) {
      removeScenario(selectedRuleId, scenarioId);
    }
  };

  const currentScenarios =
    selectedRuleId && scenarios[selectedRuleId]
      ? scenarios[selectedRuleId]
      : [];

  // --- Tab models for TabBar ---
  const tabModels: Tab[] = tabs.map((t) => ({
    id: t.id,
    title: t.title,
    dirty: t.dirty,
  }));

  return (
    <div className="flex h-screen flex-col bg-neutral-950/60 text-neutral-100">
      {/* Title bar row — sits alongside macOS traffic lights */}
      <div
        className="relative flex items-center border-b border-white/[0.06] bg-neutral-900/30 h-[38px] shrink-0"
        style={{ paddingLeft: 84 /* clear macOS traffic lights + gap */ }}
      >
        {/* Full-width drag layer behind everything */}
        <div className="absolute inset-0" data-tauri-drag-region />
        {/* File actions */}
        <div className="relative z-10 flex items-center gap-0.5 mr-1.5 shrink-0">
          <button
            onClick={handleOpenFile}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300"
            title="Open file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            onClick={handleSaveFile}
            disabled={!activeTab.dirty || !activeTab.content}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300 disabled:opacity-25 disabled:pointer-events-none"
            title="Save file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>
        </div>
        <div className="relative z-10 h-4 w-px bg-white/[0.06] mr-1.5 shrink-0" />
        {/* Tabs */}
        <div className="relative z-10 flex items-center h-full overflow-hidden">
          <TabBar
            tabs={tabModels}
            activeTabId={activeTabId}
            onSelect={setActiveTabId}
            onClose={handleCloseTab}
            onNew={handleNewTab}
          />
        </div>
        <div className="flex-1 h-full" data-tauri-drag-region />
        <UserMenu onOpenSettings={() => setSettingsOpen(true)} />
      </div>

      {/* Main content */}
      {settingsOpen ? (
        <div className="flex-1 overflow-hidden">
          <SettingsModal
            open={settingsOpen}
            onSave={handleSaveKey}
            onClose={() => setSettingsOpen(false)}
            initialKey={apiKey ?? ""}
          />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <ResizablePanels
              panels={[
                {
                  key: "editor",
                  minWidth: 200,
                  initialFlex: 4,
                  content: (
                    <PromptEditor
                      value={activeTab.content}
                      onChange={handleContentChange}
                      onParse={handleParse}
                      parsing={parsingRules}
                      parseDisabled={parseDisabled}
                      onAnalyze={handleAnalyze}
                      analyzing={analyzingPrompt}
                      issues={issues}
                      onClearIssues={clearIssues}
                      onApplyIssue={handleApplyIssue}
                    />
                  ),
                },
                {
                  key: "rules",
                  minWidth: 180,
                  initialFlex: 2.5,
                  content: (
                    <RulesList
                      rules={rules}
                      selectedRuleId={selectedRuleId}
                      onSelect={setSelectedRuleId}
                      model={model}
                      onModelChange={setModel}
                    />
                  ),
                },
                {
                  key: "scenarios",
                  minWidth: 200,
                  initialFlex: 3.5,
                  content: (
                    <ScenarioRunner
                      scenarios={currentScenarios}
                      ruleName={selectedRule?.text ?? null}
                      onGenerateScenarios={handleGenerateScenarios}
                      generatingScenarios={generatingScenarios}
                      hasSelectedRule={!!selectedRule}
                      onRunAll={handleRunAll}
                      onRunSingle={handleRunSingle}
                      onAddScenario={handleAddScenario}
                      onRemoveScenario={handleRemoveScenario}
                    />
                  ),
                },
              ]}
            />
          </div>
          <StatusBar model={model} />
        </>
      )}
      <ToastContainer />
    </div>
  );
}
