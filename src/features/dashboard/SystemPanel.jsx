import { useState } from "react";
import { Icon } from "../../shared/Icon";
import { clerkEnabled } from "../../shared/clerk";
import { connectGoogleWithMailScopes } from "../../shared/clerkGoogle";

const emptyZfnDraft = { address: "", username: "", password: "" };

export function SystemPanel({ apiState, onConnectZfn, onSyncGmail, onSyncZfn }) {
  const googleReady = apiState.providers.some(
    (provider) => provider.id === "google" && provider.configured,
  );
  const zfnProvider = apiState.providers.find((provider) => provider.id === "zfn");
  const zfnReady = Boolean(zfnProvider?.configured);

  const [zfnFormOpen, setZfnFormOpen] = useState(false);
  const [zfnDraft, setZfnDraft] = useState(emptyZfnDraft);
  const [zfnSubmitting, setZfnSubmitting] = useState(false);
  const [zfnError, setZfnError] = useState("");
  const [googleError, setGoogleError] = useState("");

  async function handleGoogleConnect() {
    setGoogleError("");
    try {
      await connectGoogleWithMailScopes();
    } catch (error) {
      setGoogleError(error.message || "Could not connect Google");
    }
  }

  async function handleZfnConnectSubmit(event) {
    event.preventDefault();
    setZfnSubmitting(true);
    setZfnError("");
    try {
      await onConnectZfn(zfnDraft);
      setZfnFormOpen(false);
      setZfnDraft(emptyZfnDraft);
    } catch (error) {
      setZfnError(error.message || "Could not connect ZFN mailbox");
    } finally {
      setZfnSubmitting(false);
    }
  }

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
        {clerkEnabled ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary-soft)]"
            onClick={handleGoogleConnect}
            type="button"
          >
            <Icon name="external" className="h-3.5 w-3.5" />
            Connect
          </button>
        ) : (
          <a
            className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary-soft)]"
            href="/api/auth/google/start"
          >
            <Icon name="external" className="h-3.5 w-3.5" />
            Connect
          </a>
        )}
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-[var(--primary-foreground)] transition hover:brightness-110"
          onClick={onSyncGmail}
          type="button"
        >
          <Icon name="sync" className="h-3.5 w-3.5" />
          Sync Gmail
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!zfnReady}
          onClick={() => setZfnFormOpen((isOpen) => !isOpen)}
          type="button"
        >
          <Icon name="external" className="h-3.5 w-3.5" />
          Connect ZFN
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-[var(--primary-foreground)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!zfnReady}
          onClick={onSyncZfn}
          type="button"
        >
          <Icon name="sync" className="h-3.5 w-3.5" />
          Sync ZFN
        </button>
      </div>
      {zfnFormOpen && (
        <form
          className="mt-3 flex flex-col gap-2 rounded-md border border-[var(--border)] p-3"
          onSubmit={handleZfnConnectSubmit}
        >
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Connects to {zfnProvider?.host}:{zfnProvider?.port} over IMAP.
          </p>
          <input
            className="rounded-md border border-[var(--border)] bg-transparent px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary-soft)]"
            onChange={(event) =>
              setZfnDraft((draft) => ({ ...draft, address: event.target.value }))
            }
            placeholder="ZFN address (name@uni-bremen.de)"
            required
            type="email"
            value={zfnDraft.address}
          />
          <input
            className="rounded-md border border-[var(--border)] bg-transparent px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary-soft)]"
            onChange={(event) =>
              setZfnDraft((draft) => ({ ...draft, username: event.target.value }))
            }
            placeholder="ZFN username"
            required
            type="text"
            value={zfnDraft.username}
          />
          <input
            className="rounded-md border border-[var(--border)] bg-transparent px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary-soft)]"
            onChange={(event) =>
              setZfnDraft((draft) => ({ ...draft, password: event.target.value }))
            }
            placeholder="ZFN password"
            required
            type="password"
            value={zfnDraft.password}
          />
          {zfnError && <p className="text-[11px] text-red-400">{zfnError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary-soft)]"
              onClick={() => {
                setZfnFormOpen(false);
                setZfnError("");
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={zfnSubmitting}
              type="submit"
            >
              {zfnSubmitting ? "Verifying..." : "Save & verify"}
            </button>
          </div>
        </form>
      )}
      {googleError && (
        <p className="mt-3 text-xs font-medium text-red-400">{googleError}</p>
      )}
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
