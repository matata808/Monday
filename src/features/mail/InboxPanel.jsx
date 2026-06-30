import { Icon } from "../../shared/Icon";

export function InboxPanel({ accounts, mailStats }) {
  const primaryAccount = accounts[0];
  const threads = accounts.flatMap((account) =>
    (account.threads ?? []).map((thread) => ({
      ...thread,
      accountName: account.name,
      inboxUrl: account.inboxUrl,
    })),
  );

  return (
    <section
      className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]"
      id="mail"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon name="inbox" className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h2 className="font-display text-lg text-[var(--foreground)]">Inbox</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 font-mono text-xs text-[var(--primary)]">
            {mailStats.unread} items
          </span>
          {primaryAccount?.inboxUrl && (
            <a
              className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
              href={primaryAccount.inboxUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Icon name="external" className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-col overflow-y-auto">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <article
              className="flex gap-3 border-b border-[var(--border-soft)] px-5 py-3.5 transition last:border-0 hover:bg-[var(--accent-soft)]"
              key={`${thread.accountName}-${thread.id}`}
            >
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-[var(--foreground)]">
                    {thread.from}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-[var(--muted-foreground)]">
                    {thread.accountName}
                  </span>
                </div>
                <p className="truncate text-xs font-medium text-[var(--foreground-soft)]">
                  {thread.subject}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">
                  {thread.action}
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="px-5 py-8 text-sm text-[var(--muted-foreground)]">
            Connect and sync Gmail to populate this rail.
          </div>
        )}
      </div>
    </section>
  );
}

