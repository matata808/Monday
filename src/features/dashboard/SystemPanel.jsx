import { Icon } from "../../shared/Icon";

export function SystemPanel({ apiState, onSyncGmail, onSyncZfn }) {
  const googleReady = apiState.providers.some(
    (provider) => provider.id === "google" && provider.configured,
  );
  const zfnReady = apiState.providers.some(
    (provider) => provider.id === "zfn" && provider.configured,
  );

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            System
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--foreground)]">
            {apiState.status}
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10">
          <Icon name="cloud" className="h-7 w-7 text-[var(--primary)]" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatusMetric
          label="DB"
          ready={Boolean(apiState.capabilities.database)}
          value={apiState.capabilities.sqlite ? "SQLite" : "Local"}
        />
        <StatusMetric
          label="Gmail"
          ready={googleReady}
          value={googleReady ? "OAuth" : "Setup"}
        />
        <StatusMetric
          label="ZFN"
          ready={zfnReady}
          value={zfnReady ? "IMAP" : "Setup"}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary-soft)]"
          href="/api/auth/google/start"
        >
          <Icon name="external" className="h-3.5 w-3.5" />
          Connect
        </a>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-[var(--primary-foreground)] transition hover:brightness-110"
          onClick={onSyncGmail}
          type="button"
        >
          <Icon name="sync" className="h-3.5 w-3.5" />
          Sync Gmail
        </button>
        <button
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!zfnReady}
          onClick={onSyncZfn}
          type="button"
        >
          <Icon name="sync" className="h-3.5 w-3.5" />
          Sync ZFN
        </button>
      </div>
      {apiState.syncStatus && (
        <p className="mt-3 text-xs font-medium text-[var(--muted-foreground)]">
          {apiState.syncStatus}
        </p>
      )}
    </section>
  );
}

function StatusMetric({ label, ready, value }) {
  return (
    <div className="rounded-md bg-[var(--accent-soft)] p-2.5">
      <span className="text-[10px] text-[var(--muted-foreground)]">{label}</span>
      <p className="mt-1 font-mono text-xs font-medium text-[var(--foreground)]">
        {value}
      </p>
      <span
        className={`mt-2 block h-1 rounded-full ${
          ready ? "bg-emerald-400" : "bg-amber-400/50"
        }`}
      />
    </div>
  );
}
