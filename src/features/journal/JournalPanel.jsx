import { Icon } from "../../shared/Icon";

export function JournalPanel({ draft, entries, onDraftChange, onSubmit }) {
  return (
    <section
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
      id="journal"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            name="journal"
            className="h-4 w-4 text-[var(--muted-foreground)]"
          />
          <h2 className="font-display text-xl text-[var(--foreground)]">
            Journal
          </h2>
        </div>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          {entries.length} entries
        </span>
      </div>
      <form className="grid gap-3" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.75fr_1.25fr]">
          <select
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            onChange={(event) =>
              onDraftChange({ ...draft, mood: event.target.value })
            }
            value={draft.mood}
          >
            <option value="steady">Steady</option>
            <option value="locked in">Locked in</option>
            <option value="tired">Tired</option>
            <option value="stressed">Stressed</option>
          </select>
          <input
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            onChange={(event) =>
              onDraftChange({ ...draft, focus: event.target.value })
            }
            placeholder="Main focus"
            value={draft.focus}
          />
        </div>
        <textarea
          className="min-h-28 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          onChange={(event) =>
            onDraftChange({ ...draft, note: event.target.value })
          }
          placeholder="Write the morning down..."
          value={draft.note}
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
          type="submit"
        >
          <Icon name="journal" />
          Save entry
        </button>
      </form>
      <div className="mt-5 grid gap-2">
        {entries.slice(0, 3).map((entry) => (
          <article
            className="rounded-md border border-[var(--border)] bg-[var(--accent-soft)] p-3"
            key={entry.id}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
              {entry.date} . {entry.mood}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
              {entry.focus}
            </p>
            {entry.note && (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted-foreground)]">
                {entry.note}
              </p>
            )}
          </article>
        ))}
        {entries.length === 0 && (
          <p className="rounded-md border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
            No journal entries yet.
          </p>
        )}
      </div>
    </section>
  );
}

