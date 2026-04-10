import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable context menu (Inspect Element)
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Disable devtools keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // F12
  if (e.key === "F12") e.preventDefault();
  // Cmd+Option+I (macOS) / Ctrl+Shift+I (Windows/Linux)
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === "i") e.preventDefault();
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === "I") e.preventDefault();
  // Cmd+Option+J / Ctrl+Shift+J (console)
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === "j") e.preventDefault();
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === "J") e.preventDefault();
  // Cmd+Option+C / Ctrl+Shift+C (element picker)
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === "c") e.preventDefault();
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === "C") e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
