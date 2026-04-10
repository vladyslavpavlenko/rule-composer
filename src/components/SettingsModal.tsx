import { useState, useEffect } from "react";
import { BsAnthropic, BsOpenai } from "react-icons/bs";
import { FaGoogle } from "react-icons/fa";
import { LuSettings2, LuKeyRound, LuInfo, LuArrowLeft } from "react-icons/lu";

type Tab = "general" | "providers" | "about";

interface Props {
  open: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
  initialKey?: string;
  showTags?: boolean;
  onShowTagsChange?: (show: boolean) => void;
}

function NavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-left ${
        active
          ? "bg-white/[0.07] text-neutral-100"
          : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ApiKeyField({
  value,
  onChange,
  onSave,
  placeholder,
  maskPrefix,
  note,
  comingSoon,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
  placeholder: string;
  maskPrefix: string;
  note: string;
  comingSoon?: boolean;
}) {
  const hasKey = value.length > 10;
  const masked = hasKey ? maskPrefix + "•••" + value.slice(-4) : "";

  return (
    <div>
      <label className="block text-sm text-neutral-300 mb-1">API Key</label>
      <p className="text-xs text-neutral-500 mb-3">{note}</p>
      {hasKey ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-neutral-400 font-mono">
            {masked}
          </div>
          <button
            onClick={() => onChange("")}
            className="rounded px-3 py-2 text-xs text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200 border border-white/[0.06]"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500/50"
          />
          <button
            onClick={() => onSave(value)}
            disabled={!value.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}
      {comingSoon && (
        <p className="mt-3 text-[11px] text-neutral-600">
          Integration coming soon — key is saved but not yet used for inference.
        </p>
      )}
    </div>
  );
}

export default function SettingsModal({ open, onSave, onClose, initialKey, showTags = true, onShowTagsChange }: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [anthropicKey, setAnthropicKey] = useState(initialKey ?? "");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  useEffect(() => {
    if (open) setAnthropicKey(initialKey ?? "");
  }, [open, initialKey]);

  if (!open) return null;

  return (
    <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-white/[0.06] px-3 py-5 flex flex-col gap-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
              Settings
            </p>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-neutral-600 hover:bg-white/[0.06] hover:text-neutral-300"
              title="Back"
            >
              <LuArrowLeft size={13} />
            </button>
          </div>
          <NavItem
            label="General"
            icon={<LuSettings2 size={14} className="shrink-0" />}
            active={tab === "general"}
            onClick={() => setTab("general")}
          />
          <NavItem
            label="Providers"
            icon={<LuKeyRound size={14} className="shrink-0" />}
            active={tab === "providers"}
            onClick={() => setTab("providers")}
          />
          <NavItem
            label="About"
            icon={<LuInfo size={14} className="shrink-0" />}
            active={tab === "about"}
            onClick={() => setTab("about")}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg px-10 py-8">

            {tab === "general" && (
              <>
                <h2 className="text-base font-semibold text-neutral-100 mb-6">General</h2>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">Show rule tags</p>
                      <p className="text-xs text-neutral-500 mt-1">Display behavioral categories on rules</p>
                    </div>
                    <button
                      onClick={() => onShowTagsChange?.(!showTags)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                        showTags ? "bg-blue-600" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                          showTags ? "translate-x-[18px] translate-y-0.5" : "translate-x-0.5 translate-y-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </>
            )}

            {tab === "providers" && (
              <>
                <h2 className="text-base font-semibold text-neutral-100 mb-6">AI Providers</h2>

                {/* Anthropic */}
                <section className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BsAnthropic size={14} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-300">Anthropic</span>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <ApiKeyField
                      value={anthropicKey}
                      onChange={setAnthropicKey}
                      onSave={onSave}
                      placeholder="sk-ant-..."
                      maskPrefix="sk-ant-"
                      note="Stored in your system keychain. Never written to disk as plaintext."
                    />
                  </div>
                </section>

                {/* OpenAI */}
                <section className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BsOpenai size={14} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-300">OpenAI</span>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <ApiKeyField
                      value={openaiKey}
                      onChange={setOpenaiKey}
                      onSave={(k) => setOpenaiKey(k)}
                      placeholder="sk-..."
                      maskPrefix="sk-"
                      note="Get your key at platform.openai.com. Stored in your system keychain."
                      comingSoon
                    />
                  </div>
                </section>

                {/* Google Gemini */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FaGoogle size={13} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-300">Google Gemini</span>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <ApiKeyField
                      value={geminiKey}
                      onChange={setGeminiKey}
                      onSave={(k) => setGeminiKey(k)}
                      placeholder="AIza..."
                      maskPrefix="AIza"
                      note="Get your key at aistudio.google.com. Stored in your system keychain."
                      comingSoon
                    />
                  </div>
                </section>
              </>
            )}

            {tab === "about" && (
              <>
                <h2 className="text-base font-semibold text-neutral-100 mb-6">About</h2>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-1.5">
                  <div className="text-sm text-neutral-300 font-medium">Rule Composer</div>
                  <div className="text-xs text-neutral-500">Version 0.0.1</div>
                  <div className="text-xs text-neutral-500 pt-1">
                    Developed by{" "}
                    <span className="text-neutral-300">Vladyslav Pavlenko</span>
                    <span className="text-neutral-600"> · </span>
                    <span className="text-neutral-500">pvlnk.xyz</span>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
    </div>
  );
}
