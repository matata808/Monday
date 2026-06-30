import { useEffect, useMemo, useState } from "react";
import { TopNav } from "./components/TopNav";
import { BriefingFeed } from "./features/briefing/BriefingFeed";
import { GreetingBar } from "./features/dashboard/GreetingBar";
import { SystemPanel } from "./features/dashboard/SystemPanel";
import { JournalPanel } from "./features/journal/JournalPanel";
import { TaskBoard } from "./features/kanban/TaskBoard";
import { statusColumns } from "./features/kanban/constants";
import { InboxPanel } from "./features/mail/InboxPanel";
import { useStoredState } from "./hooks/useStoredState";
import {
  createBoard,
  createJournalEntry,
  createSubtask,
  createTask,
  deleteBoard,
  deleteSubtask,
  deleteTask,
  fetchAuthProviders,
  fetchDashboard,
  syncGmail,
  updateSubtask,
  updateTask,
} from "./services/dashboardApi";

const defaultBoard = {
  id: "local-board",
  name: "Monday board",
  description: "",
};

const emptyTaskDraft = {
  title: "",
  description: "",
  priority: "medium",
  due: "",
};

function App() {
  const [boards, setBoards] = useStoredState("morning-dashboard.boards", []);
  const [activeBoardId, setActiveBoardId] = useStoredState(
    "morning-dashboard.activeBoardId",
    "",
  );
  const [tasks, setTasks] = useStoredState("morning-dashboard.tasks", []);
  const [mailAccounts, setMailAccounts] = useStoredState(
    "morning-dashboard.mail",
    [],
  );
  const [journalEntries, setJournalEntries] = useStoredState(
    "morning-dashboard.journal",
    [],
  );
  const [journalDraft, setJournalDraft] = useStoredState(
    "morning-dashboard.journalDraft",
    { mood: "steady", focus: "", note: "" },
  );
  const [boardDraft, setBoardDraft] = useState("");
  const [taskDraft, setTaskDraft] = useState(emptyTaskDraft);
  const [subtaskDrafts, setSubtaskDrafts] = useState({});
  const [apiState, setApiState] = useState({
    status: "local",
    providers: [],
    capabilities: {},
    syncStatus: "",
  });
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? boards[0];
  const activeBoardKey = activeBoard?.id ?? "";
  const activeTasks = useMemo(
    () =>
      tasks
        .filter((task) => !activeBoardKey || task.boardId === activeBoardKey)
        .toSorted((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [activeBoardKey, tasks],
  );

  const taskStats = useMemo(() => {
    const byStatus = Object.fromEntries(
      statusColumns.map((column) => [column.id, 0]),
    );
    for (const task of activeTasks) {
      byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
    }
    return {
      byStatus,
      active: activeTasks.filter((task) => task.status !== "Done").length,
      total: activeTasks.length,
    };
  }, [activeTasks]);

  const mailStats = useMemo(
    () =>
      mailAccounts.reduce(
        (totals, account) => ({
          unread: totals.unread + Number(account.unread ?? 0),
          priority: totals.priority + Number(account.priority ?? 0),
          previews: totals.previews + Number(account.threads?.length ?? 0),
        }),
        { unread: 0, priority: 0, previews: 0 },
      ),
    [mailAccounts],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboard, providers] = await Promise.all([
          fetchDashboard(),
          fetchAuthProviders(),
        ]);
        if (cancelled) return;
        const loadedBoards = dashboard.boards?.length
          ? dashboard.boards
          : [defaultBoard];
        setBoards(loadedBoards);
        setActiveBoardId((currentBoardId) =>
          loadedBoards.some((board) => board.id === currentBoardId)
            ? currentBoardId
            : (dashboard.activeBoardId ?? loadedBoards[0].id),
        );
        setTasks(dashboard.tasks);
        setMailAccounts(dashboard.mailAccounts);
        setJournalEntries(dashboard.journalEntries);
        setApiState((currentState) => ({
          ...currentState,
          status: dashboard.source ?? "api",
          providers: providers.providers,
          capabilities: providers.capabilities,
        }));
      } catch {
        if (cancelled) return;
        setApiState((currentState) => ({ ...currentState, status: "local" }));
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [setActiveBoardId, setBoards, setJournalEntries, setMailAccounts, setTasks]);

  function patchTaskLocally(taskId, updates) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task,
      ),
    );
    void updateTask(taskId, updates).catch(() => undefined);
  }

  function handleDragStart(taskId) {
    setDraggedTaskId(taskId);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(targetStatus) {
    if (!draggedTaskId) return;
    const targetPosition = activeTasks.filter(
      (task) => task.status === targetStatus,
    ).length;
    patchTaskLocally(draggedTaskId, {
      status: targetStatus,
      position: targetPosition,
    });
    setDraggedTaskId(null);
  }

  async function handleCreateBoard(event) {
    event.preventDefault();
    const name = boardDraft.trim();
    if (!name) return;
    setBoardDraft("");

    try {
      const result = await createBoard({ name });
      setBoards((currentBoards) => [...currentBoards, result.board]);
      setActiveBoardId(result.board.id);
    } catch {
      const board = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        name,
        description: "",
      };
      setBoards((currentBoards) => [...currentBoards, board]);
      setActiveBoardId(board.id);
    }
  }

  function handleDeleteBoard() {
    if (!activeBoard || boards.length <= 1) return;
    void deleteBoard(activeBoard.id).catch(() => undefined);
    setBoards((currentBoards) => {
      const nextBoards = currentBoards.filter(
        (board) => board.id !== activeBoard.id,
      );
      setActiveBoardId(nextBoards[0]?.id ?? "");
      return nextBoards;
    });
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.boardId !== activeBoard.id),
    );
  }

  async function handleAddTask(status = "To Do") {
    const title = taskDraft.title.trim();
    if (!title || !activeBoard) return;

    const optimisticTask = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      boardId: activeBoard.id,
      title,
      description: taskDraft.description.trim(),
      priority: taskDraft.priority,
      due: taskDraft.due,
      status,
      position: activeTasks.filter((task) => task.status === status).length,
      subtasks: [],
    };
    setTasks((currentTasks) => [optimisticTask, ...currentTasks]);
    setTaskDraft(emptyTaskDraft);

    try {
      const result = await createTask(optimisticTask);
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === optimisticTask.id ? result.task : task,
        ),
      );
    } catch {
      // Keep the optimistic local task if the API is temporarily unavailable.
    }
  }

  function handleDeleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    void deleteTask(taskId).catch(() => undefined);
  }

  function handleMoveTask(taskId, direction) {
    const task = activeTasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    const columnTasks = activeTasks
      .filter((candidate) => candidate.status === task.status)
      .toSorted((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const currentIndex = columnTasks.findIndex((candidate) => candidate.id === taskId);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= columnTasks.length) return;

    const first = columnTasks[currentIndex];
    const second = columnTasks[nextIndex];
    patchTaskLocally(first.id, { position: second.position ?? nextIndex });
    patchTaskLocally(second.id, { position: first.position ?? currentIndex });
  }

  async function handleAddSubtask(taskId) {
    const title = subtaskDrafts[taskId]?.trim();
    if (!title) return;
    const optimisticSubtask = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      taskId,
      title,
      completed: false,
      position: tasks.find((task) => task.id === taskId)?.subtasks?.length ?? 0,
    };
    setSubtaskDrafts((currentDrafts) => ({ ...currentDrafts, [taskId]: "" }));
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: [...(task.subtasks ?? []), optimisticSubtask] }
          : task,
      ),
    );

    try {
      const result = await createSubtask(taskId, { title });
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((subtask) =>
                  subtask.id === optimisticSubtask.id ? result.subtask : subtask,
                ),
              }
            : task,
        ),
      );
    } catch {
      // Keep the optimistic subtask locally if the API is unavailable.
    }
  }

  function handleToggleSubtask(taskId, subtaskId) {
    const currentSubtask = tasks
      .find((task) => task.id === taskId)
      ?.subtasks?.find((subtask) => subtask.id === subtaskId);
    if (!currentSubtask) return;
    const nextCompleted = !currentSubtask.completed;
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subtasks: (task.subtasks ?? []).map((subtask) => {
            if (subtask.id !== subtaskId) return subtask;
            return { ...subtask, completed: nextCompleted };
          }),
        };
      }),
    );
    void updateSubtask(subtaskId, { completed: nextCompleted }).catch(
      () => undefined,
    );
  }

  function handleDeleteSubtask(taskId, subtaskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: (task.subtasks ?? []).filter(
                (subtask) => subtask.id !== subtaskId,
              ),
            }
          : task,
      ),
    );
    void deleteSubtask(subtaskId).catch(() => undefined);
  }

  function handleMoveSubtask(taskId, subtaskId, direction) {
    let moved = [];
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) return task;
        const subtasks = [...(task.subtasks ?? [])].toSorted(
          (a, b) => (a.position ?? 0) - (b.position ?? 0),
        );
        const currentIndex = subtasks.findIndex(
          (subtask) => subtask.id === subtaskId,
        );
        const nextIndex = currentIndex + direction;
        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= subtasks.length) {
          return task;
        }
        const currentSubtask = subtasks[currentIndex];
        const nextSubtask = subtasks[nextIndex];
        subtasks[currentIndex] = {
          ...nextSubtask,
          position: currentSubtask.position,
        };
        subtasks[nextIndex] = {
          ...currentSubtask,
          position: nextSubtask.position,
        };
        moved = [subtasks[currentIndex], subtasks[nextIndex]];
        return { ...task, subtasks };
      }),
    );
    for (const subtask of moved) {
      void updateSubtask(subtask.id, { position: subtask.position }).catch(
        () => undefined,
      );
    }
  }

  async function handleGmailSync() {
    setApiState((currentState) => ({
      ...currentState,
      syncStatus: "Syncing Gmail...",
    }));

    try {
      const syncResult = await syncGmail();
      const dashboard = await fetchDashboard();
      setBoards(dashboard.boards ?? boards);
      setTasks(dashboard.tasks);
      setMailAccounts(dashboard.mailAccounts);
      setJournalEntries(dashboard.journalEntries);
      setApiState((currentState) => ({
        ...currentState,
        status: dashboard.source ?? currentState.status,
        syncStatus: `Synced ${syncResult.saved} messages`,
      }));
    } catch {
      setApiState((currentState) => ({
        ...currentState,
        syncStatus: "Connect Gmail first",
      }));
    }
  }

  function handleJournalSubmit(event) {
    event.preventDefault();
    if (!journalDraft.focus.trim() && !journalDraft.note.trim()) return;

    const entry = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      date: new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
      mood: journalDraft.mood,
      focus: journalDraft.focus.trim() || "No main focus set",
      note: journalDraft.note.trim(),
    };

    void createJournalEntry({
      mood: entry.mood,
      focus: entry.focus,
      note: entry.note,
    }).catch(() => undefined);
    setJournalEntries((currentEntries) => [entry, ...currentEntries]);
    setJournalDraft({ mood: journalDraft.mood, focus: "", note: "" });
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <TopNav />
      <main className="mx-auto flex max-w-[1500px] flex-col gap-8 px-5 py-7 lg:px-8">
        <GreetingBar mailStats={mailStats} taskStats={taskStats} />
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
          <TaskBoard
            activeBoard={activeBoard}
            boardDraft={boardDraft}
            boards={boards}
            onAddSubtask={handleAddSubtask}
            onAddTask={handleAddTask}
            onBoardDraftChange={setBoardDraft}
            onCreateBoard={handleCreateBoard}
            onDeleteBoard={handleDeleteBoard}
            onDeleteSubtask={handleDeleteSubtask}
            onDeleteTask={handleDeleteTask}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onMoveSubtask={handleMoveSubtask}
            onMoveTask={handleMoveTask}
            onSelectBoard={setActiveBoardId}
            onSubtaskDraftChange={setSubtaskDrafts}
            onTaskDraftChange={setTaskDraft}
            onToggleSubtask={handleToggleSubtask}
            onUpdateTask={patchTaskLocally}
            subtaskDrafts={subtaskDrafts}
            taskDraft={taskDraft}
            taskStats={taskStats}
            tasks={activeTasks}
          />
          <aside className="flex min-h-0 flex-col gap-4">
            <SystemPanel apiState={apiState} onSyncGmail={handleGmailSync} />
            <InboxPanel accounts={mailAccounts} mailStats={mailStats} />
          </aside>
        </section>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <BriefingFeed
            activeBoard={activeBoard}
            apiState={apiState}
            journalEntries={journalEntries}
            mailAccounts={mailAccounts}
            mailStats={mailStats}
            taskStats={taskStats}
            tasks={activeTasks}
          />
          <JournalPanel
            draft={journalDraft}
            entries={journalEntries}
            onDraftChange={setJournalDraft}
            onSubmit={handleJournalSubmit}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
