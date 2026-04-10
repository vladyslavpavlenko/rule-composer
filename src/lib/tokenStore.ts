/** Module-level token tracking — works like the Toast system, no prop drilling. */

export interface TokenStats {
  totalInput: number;
  totalOutput: number;
  liveInput: number;   // in-flight input tokens (streaming preview)
  liveOutput: number;  // in-flight output tokens
  active: boolean;     // a call is currently running
}

const initial: TokenStats = {
  totalInput: 0,
  totalOutput: 0,
  liveInput: 0,
  liveOutput: 0,
  active: false,
};

let state: TokenStats = { ...initial };
let listeners: Set<(s: TokenStats) => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn({ ...state }));
}

export function subscribeTokens(fn: (s: TokenStats) => void): () => void {
  listeners.add(fn);
  fn({ ...state }); // immediate snapshot
  return () => listeners.delete(fn);
}

/** Called when a new API call starts — increments preview counters. */
export function trackCallStart(estimatedInputTokens: number) {
  state = {
    ...state,
    active: true,
    liveInput: estimatedInputTokens,
    liveOutput: 0,
  };
  notify();
}

/** Called when an API call completes with actual usage from the response. */
export function trackCallEnd(inputTokens: number, outputTokens: number) {
  state = {
    ...state,
    totalInput: state.totalInput + inputTokens,
    totalOutput: state.totalOutput + outputTokens,
    liveInput: 0,
    liveOutput: 0,
    active: false,
  };
  notify();
}

export function getTokenStats(): TokenStats {
  return { ...state };
}

export function resetTokens() {
  state = { ...initial };
  notify();
}
