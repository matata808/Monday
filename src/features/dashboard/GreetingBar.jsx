import { useUser } from "@clerk/react";
import { clerkEnabled } from "../../shared/clerk";

function UserName() {
  const { user } = useUser();
  return user?.firstName ?? "there";
}

export function GreetingBar({ mailStats, taskStats }) {
  const now = new Date();
  const date = now.toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          {date}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--foreground)] md:text-4xl">
          {greeting}, {clerkEnabled ? <UserName /> : "Matin"}.
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
          You have{" "}
          <span className="font-medium text-[var(--primary)]">
            {mailStats.unread} inbox items
          </span>
          ,{" "}
          <span className="font-medium text-[var(--primary)]">
            {taskStats.byStatus["In Progress"] ?? 0} tasks in progress
          </span>
          , and{" "}
          <span className="font-medium text-[var(--foreground)]">
            {taskStats.active} active tasks
          </span>
          .
        </p>
      </div>
      <p className="font-mono text-3xl font-light text-[var(--foreground-faint)]">
        {time}
      </p>
    </section>
  );
}

