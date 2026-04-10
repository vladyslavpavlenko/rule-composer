import { useRef, useEffect, useCallback, useState } from "react";
import { LuFileText, LuX, LuCheck, LuChevronDown, LuChevronUp } from "react-icons/lu";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor as monacoEditor } from "monaco-editor";
import { PromptIssue } from "../lib/claude";

const categoryColors: Record<PromptIssue["category"], string> = {
  duplicate: "rgba(250, 204, 21, 0.15)",
  verbose: "rgba(96, 165, 250, 0.12)",
  unnecessary: "rgba(163, 163, 163, 0.12)",
  conflicting: "rgba(248, 113, 113, 0.15)",
};

const categoryBorder: Record<PromptIssue["category"], string> = {
  duplicate: "rgba(250, 204, 21, 0.5)",
  verbose: "rgba(96, 165, 250, 0.4)",
  unnecessary: "rgba(163, 163, 163, 0.3)",
  conflicting: "rgba(248, 113, 113, 0.5)",
};

const categoryLabel: Record<PromptIssue["category"], string> = {
  duplicate: "Duplicate",
  verbose: "Verbose",
  unnecessary: "Unnecessary",
  conflicting: "Conflicting",
};

const categoryDot: Record<PromptIssue["category"], string> = {
  duplicate: "bg-yellow-400",
  verbose: "bg-blue-400",
  unnecessary: "bg-neutral-400",
  conflicting: "bg-red-400",
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  onParse: () => void;
  parsing: boolean;
  parseDisabled: boolean;
  onAnalyze: () => void;
  analyzing: boolean;
  issues: PromptIssue[];
  onClearIssues: () => void;
  onApplyIssue: (issue: PromptIssue) => void;
}

export default function PromptEditor({
  value,
  onChange,
  onParse,
  parsing,
  parseDisabled,
  onAnalyze,
  analyzing,
  issues,
  onClearIssues,
  onApplyIssue,
}: Props) {
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const decorationsRef = useRef<monacoEditor.IEditorDecorationsCollection | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      el.style.setProperty("--editor-panel-width", `${entry.contentRect.width}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Apply decorations when issues change
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (decorationsRef.current) {
      decorationsRef.current.clear();
      decorationsRef.current = null;
    }

    if (issues.length === 0) return;

    const model = editor.getModel();
    if (!model) return;

    const text = model.getValue();
    const decorations: monacoEditor.IModelDeltaDecoration[] = [];

    for (const cat of Object.keys(categoryColors) as PromptIssue["category"][]) {
      const className = `prompt-issue-${cat}`;
      if (!document.querySelector(`style[data-issue="${cat}"]`)) {
        const style = document.createElement("style");
        style.setAttribute("data-issue", cat);
        style.textContent = `.${className} { background-color: ${categoryColors[cat]}; border-bottom: 1.5px solid ${categoryBorder[cat]}; }`;
        document.head.appendChild(style);
      }
    }

    for (const issue of issues) {
      const idx = text.indexOf(issue.quote);
      if (idx === -1) continue;

      const startPos = model.getPositionAt(idx);
      const endPos = model.getPositionAt(idx + issue.quote.length);

      decorations.push({
        range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
        options: {
          className: `prompt-issue-${issue.category}`,
          hoverMessage: { value: `**${categoryLabel[issue.category]}**: ${issue.suggestion}` },
        },
      });
    }

    decorationsRef.current = editor.createDecorationsCollection(decorations);
  }, [issues]);

  const scrollToIssue = (issue: PromptIssue) => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    const idx = model.getValue().indexOf(issue.quote);
    if (idx === -1) return;
    const pos = model.getPositionAt(idx);
    editor.revealLineInCenter(pos.lineNumber);
    editor.setPosition(pos);
    editor.focus();
  };

  const hasIssues = issues.length > 0;
  const [issuesCollapsed, setIssuesCollapsed] = useState(false);

  // Expand automatically when new issues arrive
  useEffect(() => {
    if (issues.length > 0) setIssuesCollapsed(false);
  }, [issues.length]);

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 h-[38px] shrink-0">
        <LuFileText size={12} className="text-neutral-500 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Editor
        </span>
        <div className="flex-1" />
        <button
          onClick={onAnalyze}
          disabled={analyzing || !value.trim()}
          className="rounded px-3 py-1 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-300 disabled:opacity-25 disabled:pointer-events-none"
        >
          {analyzing ? "Analyzing…" : "Analyze"}
        </button>
        <button
          onClick={onParse}
          disabled={parsing || parseDisabled}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {parsing ? "Parsing…" : "Parse Rules"}
        </button>
      </div>

      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          theme="vs-dark"
          value={value}
          onChange={(v) => onChange(v ?? "")}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />

        {/* Issues panel — floats over editor */}
        {hasIssues && (
          <div className="absolute top-0 left-0 right-0 z-10 border-b border-white/[0.08] bg-neutral-950/95 backdrop-blur-sm">
            <button
              onClick={() => setIssuesCollapsed((c) => !c)}
              className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-white/[0.03]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {issues.length} issue{issues.length > 1 ? "s" : ""} found
              </span>
              <div className="flex items-center gap-1">
                <span
                  onClick={(e) => { e.stopPropagation(); onClearIssues(); }}
                  className="rounded p-0.5 text-neutral-600 hover:bg-white/[0.06] hover:text-neutral-400"
                  title="Dismiss"
                >
                  <LuX size={11} />
                </span>
                {issuesCollapsed ? <LuChevronDown size={12} className="text-neutral-600" /> : <LuChevronUp size={12} className="text-neutral-600" />}
              </div>
            </button>
            {!issuesCollapsed && (
              <div className="max-h-[180px] overflow-y-auto px-3 pb-2">
                <div className="space-y-1">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-white/[0.02] group"
                    >
                      <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${categoryDot[issue.category]}`} />
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => scrollToIssue(issue)}
                      >
                        <div className="text-[11px] text-neutral-300 leading-snug">
                          <span className="text-neutral-500">{categoryLabel[issue.category]}:</span>{" "}
                          {issue.suggestion}
                        </div>
                        {issue.replacement !== undefined && (
                          <div className="mt-0.5 text-[11px] text-neutral-500 leading-snug">
                            {issue.replacement
                              ? <span>→ <span className="text-neutral-400 italic">{issue.replacement.length > 80 ? issue.replacement.slice(0, 80) + "…" : issue.replacement}</span></span>
                              : <span className="italic">Remove</span>
                            }
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onApplyIssue(issue); }}
                        className="rounded-md p-1 text-neutral-600 hover:bg-white/[0.06] hover:text-green-400 opacity-0 group-hover:opacity-100 shrink-0"
                        title="Apply suggestion"
                      >
                        <LuCheck size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
