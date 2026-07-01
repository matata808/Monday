import { Icon } from "../../shared/Icon";

function eventTime(event) {
  if (event.allDay) return "All day";
  if (!event.start) return "";
  return new Date(event.start).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(event) {
  if (!event.start) return false;
  const start = new Date(event.start);
  const now = new Date();
  return (
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate()
  );
}

function eventDay(event) {
  if (!event.start) return "Unscheduled";
  return new Date(event.start).toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function DeadlineBadge() {
  return (
    <span className="flex items-center gap-1 rounded bg-amber-400/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
      <Icon name="alert" className="h-3 w-3" />
      Deadline
    </span>
  );
}

export function ScheduleStrip({ calendarError, events, onOpenCalendar }) {
  const todayEvents = events.filter(isToday);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="circle" className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h2 className="font-display text-xl text-[var(--foreground)]">Today</h2>
          <span className="font-mono text-xs text-[var(--muted-foreground)]">
            {todayEvents.length} events
          </span>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary-soft)]"
          onClick={onOpenCalendar}
          type="button"
        >
          Open calendar
          <Icon name="arrow" className="h-3 w-3" />
        </button>
      </div>
      {todayEvents.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {todayEvents.map((event) => (
            <article
              className="min-w-[180px] shrink-0 rounded-md bg-[var(--accent-soft)] p-3"
              key={event.id}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                  {eventTime(event)}
                </span>
                {event.deadline && <DeadlineBadge />}
              </div>
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {event.title}
              </p>
              {event.location && (
                <p className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">
                  {event.location}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          {calendarError || "No events scheduled for today."}
        </p>
      )}
    </section>
  );
}

export function CalendarPage({ calendarError, events }) {
  const groups = [];
  for (const event of events) {
    const day = eventDay(event);
    const group = groups.find((candidate) => candidate.day === day);
    if (group) {
      group.events.push(event);
    } else {
      groups.push({ day, events: [event] });
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="circle" className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h2 className="font-display text-xl text-[var(--foreground)]">
            Calendar
          </h2>
          <span className="font-mono text-xs text-[var(--muted-foreground)]">
            next 7 days
          </span>
        </div>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          {events.length} events
        </span>
      </div>
      {groups.length > 0 ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.day}>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {group.day}
              </p>
              <div className="flex flex-col gap-1.5">
                {group.events.map((event) => (
                  <article
                    className="flex items-center gap-3 rounded-md border border-[var(--border-soft)] bg-[var(--accent-soft)] px-3 py-2.5"
                    key={event.id}
                  >
                    <span className="w-16 shrink-0 font-mono text-xs text-[var(--muted-foreground)]">
                      {eventTime(event)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {event.title}
                      </p>
                      {event.location && (
                        <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                          {event.location}
                        </p>
                      )}
                    </div>
                    {event.deadline && <DeadlineBadge />}
                    {event.link && (
                      <a
                        className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                        href={event.link}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Icon name="external" className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          {calendarError ||
            "No upcoming events. Connect Google on the System page to sync your calendar."}
        </p>
      )}
    </section>
  );
}
