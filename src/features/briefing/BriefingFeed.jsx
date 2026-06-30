import { Icon } from "../../shared/Icon";
import { buildBriefingItems } from "./buildBriefingItems";

export function BriefingFeed({
  activeBoard,
  apiState,
  journalEntries,
  mailAccounts,
  mailStats,
  taskStats,
  tasks,
}) {
  const items = buildBriefingItems({
    activeBoard,
    apiState,
    journalEntries,
    mailAccounts,
    mailStats,
    taskStats,
    tasks,
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="spark" className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h2 className="font-display text-xl text-[var(--foreground)]">
            Monday Briefing
          </h2>
        </div>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          Live from dashboard
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        {items.map((item, index) => (
          <article
            className={`group flex min-h-[130px] flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--primary-soft)] ${
              index === 0 ? "md:col-span-2" : ""
            }`}
            key={item.id}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-[var(--primary-soft)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--primary)]">
                {item.category}
              </span>
              {item.urgent && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-amber-300">
                  <Icon name="alert" className="h-3 w-3" />
                  Watch
                </span>
              )}
            </div>
            <p
              className={`font-medium leading-snug text-[var(--foreground)] transition group-hover:text-[var(--primary)] ${
                index === 0 ? "text-base" : "text-sm"
              }`}
            >
              {item.headline}
            </p>
            <div className="mt-auto flex items-center gap-2 pt-1">
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                {item.source}
              </span>
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                .
              </span>
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                {item.detail}
              </span>
              <Icon
                name="arrow"
                className="ml-auto h-3 w-3 text-[var(--muted-foreground)] transition group-hover:text-[var(--primary)]"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
