export function TopNav() {
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
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {["Dashboard", "Mail", "Tasks", "Journal"].map((item, index) => (
            <a
              className={`text-xs font-medium transition-colors ${
                index === 0
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              href={`#${item.toLowerCase()}`}
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/15">
          <span className="font-mono text-[11px] font-medium text-amber-300">
            M
          </span>
        </div>
      </div>
    </header>
  );
}
