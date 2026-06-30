import { Icon } from "../../shared/Icon";
import { priorities, statusColumns } from "./constants";

export function TaskBoard({
  activeBoard,
  boardDraft,
  boards,
  onAddSubtask,
  onAddTask,
  onBoardDraftChange,
  onCreateBoard,
  onDeleteBoard,
  onDeleteSubtask,
  onDeleteTask,
  onDragOver,
  onDragStart,
  onDrop,
  onMoveSubtask,
  onMoveTask,
  onSelectBoard,
  onSubtaskDraftChange,
  onTaskDraftChange,
  onToggleSubtask,
  onUpdateTask,
  subtaskDrafts,
  taskDraft,
  taskStats,
  tasks,
}) {
  return (
    <section
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
      id="tasks"
    >
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="board" className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h2 className="font-display text-xl text-[var(--foreground)]">
              Kanban
            </h2>
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              {taskStats.total} tasks
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Boards, ordered tasks, metadata, and subtasks backed by SQLite.
          </p>
        </div>
        <form className="flex gap-2" onSubmit={onCreateBoard}>
          <input
            className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            onChange={(event) => onBoardDraftChange(event.target.value)}
            placeholder="New board"
            value={boardDraft}
          />
          <button
            className="rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-[var(--primary-foreground)]"
            type="submit"
          >
            Board
          </button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {boards.map((board) => (
          <button
            aria-pressed={board.id === activeBoard?.id}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              board.id === activeBoard?.id
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            key={board.id}
            onClick={() => onSelectBoard(board.id)}
            type="button"
          >
            {board.name}
          </button>
        ))}
        <button
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-400/20 px-3 py-1.5 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={boards.length <= 1}
          onClick={onDeleteBoard}
          type="button"
        >
          <Icon name="trash" className="h-3 w-3" />
          Delete board
        </button>
      </div>

      <div className="mb-4 grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 lg:grid-cols-[1.4fr_1fr_0.7fr_0.8fr_auto]">
        <input
          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          onChange={(event) =>
            onTaskDraftChange((draft) => ({ ...draft, title: event.target.value }))
          }
          placeholder="Task title"
          value={taskDraft.title}
        />
        <input
          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          onChange={(event) =>
            onTaskDraftChange((draft) => ({
              ...draft,
              description: event.target.value,
            }))
          }
          placeholder="Description"
          value={taskDraft.description}
        />
        <select
          aria-label="New task priority"
          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          onChange={(event) =>
            onTaskDraftChange((draft) => ({
              ...draft,
              priority: event.target.value,
            }))
          }
          value={taskDraft.priority}
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <input
          aria-label="New task due date"
          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          onChange={(event) =>
            onTaskDraftChange((draft) => ({ ...draft, due: event.target.value }))
          }
          placeholder="Due"
          value={taskDraft.due}
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
          onClick={() => onAddTask("To Do")}
          type="button"
        >
          <Icon name="plus" />
          Add task
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {statusColumns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);
          return (
            <div
              aria-label={`${column.label} tasks`}
              className="flex min-h-[320px] flex-col gap-2"
              key={column.id}
              onDragOver={onDragOver}
              onDrop={() => onDrop(column.id)}
              role="region"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${column.accent}`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {column.label}
                </span>
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[var(--muted)] font-mono text-xs text-[var(--muted-foreground)]">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {columnTasks
                  .toSorted((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      onAddSubtask={onAddSubtask}
                      onDeleteSubtask={onDeleteSubtask}
                      onDeleteTask={onDeleteTask}
                      onDragStart={onDragStart}
                      onMoveSubtask={onMoveSubtask}
                      onMoveTask={onMoveTask}
                      onSubtaskDraftChange={onSubtaskDraftChange}
                      onToggleSubtask={onToggleSubtask}
                      onUpdateTask={onUpdateTask}
                      subtaskDraft={subtaskDrafts[task.id] ?? ""}
                      task={task}
                    />
                  ))}
                {columnTasks.length === 0 && (
                  <div className="rounded-md border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--muted-foreground)]">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TaskCard({
  onAddSubtask,
  onDeleteSubtask,
  onDeleteTask,
  onDragStart,
  onMoveSubtask,
  onMoveTask,
  onSubtaskDraftChange,
  onToggleSubtask,
  onUpdateTask,
  subtaskDraft,
  task,
}) {
  const done = task.status === "Done";

  return (
    <article
      className="group cursor-grab rounded-md border border-[var(--border)] bg-[var(--accent-soft)] p-3 transition hover:border-[var(--primary-soft)] hover:bg-[var(--accent)]"
      draggable
      onDragStart={() => onDragStart(task.id)}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            done ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
          }`}
          name={done ? "check" : "circle"}
        />
        <div className="min-w-0 flex-1">
          <input
            className={`w-full bg-transparent text-sm font-medium leading-snug outline-none ${
              done
                ? "text-[var(--muted-foreground)] line-through"
                : "text-[var(--foreground)]"
            }`}
            onBlur={(event) => {
              if (event.target.value.trim() && event.target.value !== task.title) {
                onUpdateTask(task.id, { title: event.target.value.trim() });
              }
            }}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
            defaultValue={task.title}
          />
          <textarea
            className="mt-2 min-h-12 w-full resize-none rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground-soft)] outline-none focus:border-[var(--primary)]"
            onBlur={(event) => {
              if (event.target.value !== (task.description ?? "")) {
                onUpdateTask(task.id, { description: event.target.value });
              }
            }}
            placeholder="Task notes"
            defaultValue={task.description ?? ""}
          />
          <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
            <select
              aria-label={`${task.title} priority`}
              className="rounded bg-[var(--muted)] px-1.5 py-1 font-mono text-[10px] text-[var(--foreground)]"
              onChange={(event) =>
                onUpdateTask(task.id, { priority: event.target.value })
              }
              value={task.priority ?? "medium"}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <input
              aria-label={`${task.title} due date`}
              className="rounded bg-[var(--muted)] px-1.5 py-1 font-mono text-[10px] text-[var(--foreground)] outline-none"
              onBlur={(event) => {
                if (event.target.value !== (task.due ?? "")) {
                  onUpdateTask(task.id, { due: event.target.value });
                }
              }}
              placeholder="Due"
              defaultValue={task.due ?? ""}
            />
            <PriorityDot priority={task.priority ?? "medium"} />
          </div>
          <div className="mt-2 flex items-center gap-1">
            <button
              aria-label="Move task up"
              className="rounded border border-[var(--border)] p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => onMoveTask(task.id, -1)}
              type="button"
            >
              <Icon name="up" className="h-3 w-3" />
            </button>
            <button
              aria-label="Move task down"
              className="rounded border border-[var(--border)] p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => onMoveTask(task.id, 1)}
              type="button"
            >
              <Icon name="down" className="h-3 w-3" />
            </button>
            <button
              aria-label={`Delete ${task.title}`}
              className="ml-auto rounded border border-red-400/20 p-1 text-red-300 hover:bg-red-400/10"
              onClick={() => onDeleteTask(task.id)}
              type="button"
            >
              <Icon name="trash" className="h-3 w-3" />
            </button>
          </div>
          <SubtaskList
            onAddSubtask={onAddSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onMoveSubtask={onMoveSubtask}
            onSubtaskDraftChange={onSubtaskDraftChange}
            onToggleSubtask={onToggleSubtask}
            subtaskDraft={subtaskDraft}
            task={task}
          />
        </div>
      </div>
    </article>
  );
}

function SubtaskList({
  onAddSubtask,
  onDeleteSubtask,
  onMoveSubtask,
  onSubtaskDraftChange,
  onToggleSubtask,
  subtaskDraft,
  task,
}) {
  const completedSubtasks = (task.subtasks ?? []).filter(
    (subtask) => subtask.completed,
  ).length;

  return (
    <div className="mt-3 border-t border-[var(--border)] pt-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
          Subtasks {completedSubtasks}/{task.subtasks?.length ?? 0}
        </span>
      </div>
      <div className="grid gap-1.5">
        {(task.subtasks ?? [])
          .toSorted((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((subtask) => (
            <div className="flex items-center gap-1.5" key={subtask.id}>
              <button
                aria-label={`${subtask.completed ? "Mark incomplete" : "Mark complete"} ${subtask.title}`}
                className="text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                onClick={() => onToggleSubtask(task.id, subtask.id)}
                type="button"
              >
                <Icon
                  className="h-3.5 w-3.5"
                  name={subtask.completed ? "check" : "circle"}
                />
              </button>
              <span
                className={`min-w-0 flex-1 truncate text-xs ${
                  subtask.completed
                    ? "text-[var(--muted-foreground)] line-through"
                    : "text-[var(--foreground-soft)]"
                }`}
              >
                {subtask.title}
              </span>
              <button
                aria-label="Move subtask up"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                onClick={() => onMoveSubtask(task.id, subtask.id, -1)}
                type="button"
              >
                <Icon name="up" className="h-3 w-3" />
              </button>
              <button
                aria-label="Move subtask down"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                onClick={() => onMoveSubtask(task.id, subtask.id, 1)}
                type="button"
              >
                <Icon name="down" className="h-3 w-3" />
              </button>
              <button
                aria-label={`Delete ${subtask.title}`}
                className="text-red-300 hover:text-red-200"
                onClick={() => onDeleteSubtask(task.id, subtask.id)}
                type="button"
              >
                <Icon name="trash" className="h-3 w-3" />
              </button>
            </div>
          ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        <input
          className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          onChange={(event) =>
            onSubtaskDraftChange((drafts) => ({
              ...drafts,
              [task.id]: event.target.value,
            }))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") onAddSubtask(task.id);
          }}
          placeholder="Add subtask"
          value={subtaskDraft}
        />
        <button
          className="rounded bg-[var(--primary)] px-2 text-xs font-semibold text-[var(--primary-foreground)]"
          onClick={() => onAddSubtask(task.id)}
          type="button"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function PriorityDot({ priority }) {
  const colors = {
    high: "bg-red-400",
    medium: "bg-amber-400",
    low: "bg-emerald-400",
  };

  return (
    <span
      className={`mt-2 inline-block h-1.5 w-1.5 rounded-full ${colors[priority]}`}
    />
  );
}
