const navTabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tasks", label: "Tasks" },
  { id: "calendar", label: "Calendar" },
  { id: "mail", label: "Mail" },
  { id: "journal", label: "Journal" },
  { id: "system", label: "System" },
];

export function TopNav({ activeTab, onSelectTab }) {
  return (
    <header className="border-b border-[var(--border)] px-5 py-3 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--primary)]">
            <span className="font-mono text-[10px] font-bold text-[var(--primary-foreground)]">
              M
            </span>
          </div>
          <span className="text-sm font-medium text-[var(--foreground-muted)]">
            Monday
          </span>
        </div>
        <nav
          className="flex items-center gap-1 overflow-x-auto sm:gap-2"
          aria-label="Primary"
        >
          {navTabs.map((tab) => (
            <button
              aria-current={tab.id === activeTab ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab.id === activeTab
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="hidden h-7 w-7 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/15 sm:flex">
          <span className="font-mono text-[11px] font-medium text-amber-300">
            M
          </span>
        </div>
      </div>
    </header>
  );
}
