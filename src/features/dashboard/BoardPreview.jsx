import { Icon } from "../../shared/Icon";
import { statusColumns } from "../kanban/constants";

const previewTasksPerColumn = 3;

export function BoardPreview({ activeBoard, onOpenBoard, taskStats, tasks }) {
  return (
    <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="board" className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h2 className="font-display text-xl text-[var(--foreground)]">
              {activeBoard?.name ?? "Board"}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {taskStats.active} active of {taskStats.total} tasks
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary-soft)]"
          onClick={onOpenBoard}
          type="button"
        >
          Open board
          <Icon name="arrow" className="h-3 w-3" />
        </button>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        {statusColumns.map((column) => {
          const columnTasks = tasks
            .filter((task) => task.status === column.id)
            .slice(0, previewTasksPerColumn);
          return (
            <div
              className="rounded-md bg-[var(--accent-soft)] p-3"
              key={column.id}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${column.accent}`} />
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  {column.label}
                </span>
                <span className="ml-auto font-mono text-[10px] text-[var(--muted-foreground)]">
                  {taskStats.byStatus[column.id] ?? 0}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {columnTasks.map((task) => (
                  <li
                    className="truncate rounded border border-[var(--border-soft)] bg-[var(--card)] px-2 py-1.5 text-xs text-[var(--foreground)]"
                    key={task.id}
                  >
                    {task.title}
                  </li>
                ))}
                {columnTasks.length === 0 && (
                  <li className="px-2 py-1.5 text-[11px] text-[var(--muted-foreground)]">
                    Nothing here
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
