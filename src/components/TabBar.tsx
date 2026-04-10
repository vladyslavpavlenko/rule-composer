export interface Tab {
  id: string;
  title: string;
  dirty: boolean;
}

interface Props {
  tabs: Tab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

export default function TabBar({ tabs, activeTabId, onSelect, onClose, onNew }: Props) {
  return (
    <div className="flex items-center gap-0.5 px-1 min-h-[33px]">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`group flex items-center cursor-pointer rounded-md pl-2.5 pr-1 py-1 text-xs select-none shrink-0 transition-colors ${
            activeTabId === tab.id
              ? "bg-white/[0.1] text-neutral-100"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.05]"
          }`}
        >
          {/* Dirty dot — tiny, inline, no extra margin */}
          {tab.dirty && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 shrink-0" />
          )}
          <span className="max-w-[140px] truncate">{tab.title}</span>
          {/* Close button — fixed 20×20 square, consistent padding */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.id);
            }}
            className="ml-1.5 flex items-center justify-center w-5 h-5 rounded text-neutral-600 hover:text-neutral-200 hover:bg-white/[0.1] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={onNew}
        className="shrink-0 flex items-center justify-center w-6 h-6 rounded text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.05] transition-colors ml-0.5"
        title="New tab"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
