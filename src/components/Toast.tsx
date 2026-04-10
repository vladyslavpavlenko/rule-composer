import { useState, useEffect, useCallback } from "react";

export interface ToastMessage {
  id: string;
  type: "error" | "info" | "loading";
  text: string;
}

let _addToast: (msg: ToastMessage) => void = () => {};
let _removeToast: (id: string) => void = () => {};

function makeId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Show a toast. Returns the id so you can dismiss it later. */
export function showToast(type: ToastMessage["type"], text: string): string {
  const id = makeId();
  _addToast({ id, type, text });
  return id;
}

export function dismissToast(id: string) {
  _removeToast(id);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts((prev) => [...prev, msg]);
    if (msg.type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 5000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    _addToast = addToast;
    _removeToast = removeToast;
  }, [addToast, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-[46px] right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs shadow-lg backdrop-blur-sm animate-slide-up ${
            t.type === "error"
              ? "border-red-700/50 bg-red-950/90 text-red-300"
              : t.type === "loading"
              ? "border-blue-700/50 bg-blue-950/90 text-blue-300"
              : "border-neutral-700/50 bg-neutral-900/90 text-neutral-300"
          }`}
        >
          {t.type === "loading" && (
            <span className="mt-0.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent flex-shrink-0" />
          )}
          {t.type === "error" && (
            <span className="mt-px flex-shrink-0">✕</span>
          )}
          <span className="flex-1 break-words select-text">{t.text}</span>
          {t.type === "error" && (
            <button
              onClick={() => navigator.clipboard.writeText(t.text)}
              className="ml-1 flex-shrink-0 text-red-500 hover:text-red-300"
              title="Copy error"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          )}
          <button
            onClick={() => removeToast(t.id)}
            className="ml-1 flex-shrink-0 text-neutral-500 hover:text-neutral-300"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
