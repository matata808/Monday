import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import App from "./App";
import {
  connectZfn,
  createBoard,
  createJournalEntry,
  createSubtask,
  createTask,
  deleteTask,
  fetchAuthProviders,
  fetchDashboard,
  syncGmail,
  syncZfn,
  updateSubtask,
  updateTask,
} from "./services/dashboardApi";

const dashboard = {
  source: "sqlite",
  boards: [
    {
      id: "board-1",
      name: "Monday board",
      description: "Inbox-driven queue",
      taskCount: 3,
    },
  ],
  activeBoardId: "board-1",
  tasks: [
    {
      id: "1",
      boardId: "board-1",
      title: "Review inbox deadlines",
      description: "Check Gmail and ZFN for deadline-sensitive items.",
      status: "To Do",
      priority: "high",
      due: "Today",
      position: 0,
      subtasks: [
        {
          id: "s1",
          taskId: "1",
          title: "Open registration mail",
          completed: false,
          position: 0,
        },
      ],
    },
    {
      id: "2",
      boardId: "board-1",
      title: "Build Monday workspace",
      description: "Add professional controls.",
      status: "In Progress",
      priority: "medium",
      due: "Jun 30",
      position: 0,
      subtasks: [],
    },
    {
      id: "3",
      boardId: "board-1",
      title: "Go for a walk",
      description: "",
      status: "Done",
      priority: "low",
      due: "",
      position: 0,
      subtasks: [],
    },
  ],
  mailAccounts: [
    {
      id: "gmail",
      name: "Gmail",
      address: "person@example.test",
      inboxUrl: "https://mail.google.com/",
      unread: 10,
      priority: 1,
      lastChecked: "2026-06-29T22:06:18.676Z",
      nextAction: "Review",
      threads: [
        {
          id: "m1",
          from: "Professor",
          subject: "Exam registration deadline",
          action: "Reply today",
        },
      ],
    },
  ],
  journalEntries: [],
};

vi.mock("./services/dashboardApi", () => ({
  createBoard: vi.fn(({ name }) =>
    Promise.resolve({
      board: {
        id: "board-2",
        name,
        description: "",
        taskCount: 0,
      },
    }),
  ),
  createJournalEntry: vi.fn(() => Promise.resolve({})),
  createSubtask: vi.fn((taskId, { title }) =>
    Promise.resolve({
      subtask: {
        id: "s2",
        taskId,
        title,
        completed: false,
        position: 1,
      },
    }),
  ),
  createTask: vi.fn((task) =>
    Promise.resolve({
      task: {
        ...task,
        id: "created-task",
      },
    }),
  ),
  deleteBoard: vi.fn(() => Promise.resolve({ deleted: true })),
  deleteSubtask: vi.fn(() => Promise.resolve({ deleted: true })),
  deleteTask: vi.fn(() => Promise.resolve({ deleted: true })),
  fetchAuthProviders: vi.fn(() =>
    Promise.resolve({
      capabilities: {
        database: true,
        sqlite: true,
        googleOAuth: true,
        zfnImap: true,
      },
      providers: [
        {
          id: "google",
          name: "Google Gmail",
          configured: true,
        },
        {
          id: "zfn",
          name: "ZFN Webmail",
          configured: true,
          host: "imap.uni-bremen.de",
          port: 993,
        },
      ],
    }),
  ),
  fetchDashboard: vi.fn(() => Promise.resolve(dashboard)),
  fetchWeather: vi.fn(() =>
    Promise.resolve({
      location: "Bremen, DE",
      temperature: 21,
      feelsLike: 19,
      humidity: 60,
      windSpeed: 14,
      condition: "Partly cloudy",
      icon: "cloud",
      high: 24,
      low: 13,
      unit: "°C",
    }),
  ),
  connectZfn: vi.fn(({ address }) =>
    Promise.resolve({
      status: "connected",
      verified: true,
      connection: { id: "zfn-1", address },
    }),
  ),
  syncGmail: vi.fn(() => Promise.resolve({ saved: 10 })),
  syncZfn: vi.fn(() => Promise.resolve({ saved: 5 })),
  updateSubtask: vi.fn(() => Promise.resolve({})),
  updateTask: vi.fn(() => Promise.resolve({})),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.clearAllMocks();
});

function openTab(label) {
  const nav = screen.getByRole("navigation", { name: /primary/i });
  fireEvent.click(within(nav).getByRole("button", { name: label }));
}

describe("App", () => {
  it("renders the dashboard overview with greeting, weather, and board preview", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /good morning|good afternoon|good evening/i,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Bremen, DE")).toBeInTheDocument();
    expect(screen.getByText("21°C")).toBeInTheDocument();
    expect(screen.getByText("Partly cloudy")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Monday board" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Review inbox deadlines")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open board/i }),
    ).toBeInTheDocument();
  });

  it("switches pages through the tab bar", async () => {
    render(<App />);

    await screen.findByText("Bremen, DE");
    openTab("Mail");
    expect(screen.getByText("Exam registration deadline")).toBeInTheDocument();
    expect(screen.getByText("Professor")).toBeInTheDocument();

    openTab("Tasks");
    expect(screen.getByDisplayValue("Review inbox deadlines")).toBeInTheDocument();

    openTab("Journal");
    expect(screen.getByPlaceholderText("Main focus")).toBeInTheDocument();

    openTab("System");
    expect(screen.getByRole("button", { name: /sync zfn/i })).toBeInTheDocument();
  });

  it("opens the full board from the dashboard preview", async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /open board/i }));

    expect(screen.getByDisplayValue("Review inbox deadlines")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
  });

  it("creates a board and selects it", async () => {
    render(<App />);

    openTab("Tasks");
    await screen.findByRole("button", { name: "Monday board" });
    fireEvent.change(screen.getByPlaceholderText("New board"), {
      target: { value: "Client work" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^board$/i }));

    await waitFor(() => {
      expect(createBoard).toHaveBeenCalledWith({ name: "Client work" });
    });
    expect(await screen.findByRole("button", { name: "Client work" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("adds a task with metadata to the active board", async () => {
    render(<App />);

    openTab("Tasks");
    await screen.findByRole("button", { name: "Monday board" });
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Write dashboard tests" },
    });
    fireEvent.change(screen.getByPlaceholderText("Description"), {
      target: { value: "Cover boards and subtasks" },
    });
    fireEvent.change(screen.getByLabelText("New task priority"), {
      target: { value: "high" },
    });
    fireEvent.change(screen.getByLabelText("New task due date"), {
      target: { value: "Tomorrow" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: "board-1",
          title: "Write dashboard tests",
          description: "Cover boards and subtasks",
          priority: "high",
          due: "Tomorrow",
          status: "To Do",
        }),
      );
    });
    expect(await screen.findByDisplayValue("Write dashboard tests")).toBeInTheDocument();
  });

  it("moves a task between columns with drag and drop", async () => {
    render(<App />);

    openTab("Tasks");
    const draggedTask = await screen.findByDisplayValue("Review inbox deadlines");
    const doneColumn = screen.getByRole("region", { name: /done tasks/i });

    fireEvent.dragStart(draggedTask.closest("article"));
    fireEvent.dragOver(doneColumn);
    fireEvent.drop(doneColumn);

    expect(updateTask).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ status: "Done" }),
    );
    expect(within(doneColumn).getByDisplayValue("Review inbox deadlines")).toBeInTheDocument();
  });

  it("creates, toggles, and deletes subtasks", async () => {
    render(<App />);

    openTab("Tasks");
    const taskCard = (await screen.findByDisplayValue("Review inbox deadlines")).closest(
      "article",
    );
    fireEvent.change(within(taskCard).getByPlaceholderText("Add subtask"), {
      target: { value: "Collect deadline" },
    });
    fireEvent.click(within(taskCard).getByRole("button", { name: /^add$/i }));

    await waitFor(() => {
      expect(createSubtask).toHaveBeenCalledWith("1", {
        title: "Collect deadline",
      });
    });
    fireEvent.click(
      within(taskCard).getByRole("button", {
        name: /mark complete open registration mail/i,
      }),
    );
    expect(updateSubtask).toHaveBeenCalledWith("s1", { completed: true });

    fireEvent.click(
      within(taskCard).getByRole("button", {
        name: /delete open registration mail/i,
      }),
    );
    expect(screen.queryByText("Open registration mail")).not.toBeInTheDocument();
  });

  it("deletes a task", async () => {
    render(<App />);

    openTab("Tasks");
    await screen.findByDisplayValue("Review inbox deadlines");
    fireEvent.click(
      screen.getByRole("button", { name: /delete review inbox deadlines/i }),
    );

    expect(deleteTask).toHaveBeenCalledWith("1");
    expect(screen.queryByDisplayValue("Review inbox deadlines")).not.toBeInTheDocument();
  });

  it("saves a journal entry", async () => {
    render(<App />);

    openTab("Journal");
    await screen.findByRole("heading", { name: /journal/i });
    fireEvent.change(screen.getByPlaceholderText("Main focus"), {
      target: { value: "Finish the dashboard" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write the morning down..."), {
      target: { value: "Start focused and keep the inbox short." },
    });
    fireEvent.click(screen.getByRole("button", { name: /save entry/i }));

    expect(createJournalEntry).toHaveBeenCalledWith({
      mood: "steady",
      focus: "Finish the dashboard",
      note: "Start focused and keep the inbox short.",
    });
    expect(screen.getAllByText("Finish the dashboard").length).toBeGreaterThan(0);
  });

  it("syncs Gmail and refreshes dashboard data", async () => {
    render(<App />);

    openTab("System");
    fireEvent.click(await screen.findByRole("button", { name: /sync gmail/i }));

    await waitFor(() => {
      expect(syncGmail).toHaveBeenCalled();
    });
    expect(fetchDashboard).toHaveBeenCalledTimes(2);
    expect(fetchAuthProviders).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Synced 10 messages")).toBeInTheDocument();
  });

  it("syncs ZFN and refreshes dashboard data", async () => {
    render(<App />);

    openTab("System");
    fireEvent.click(await screen.findByRole("button", { name: /sync zfn/i }));

    await waitFor(() => {
      expect(syncZfn).toHaveBeenCalled();
    });
    expect(fetchDashboard).toHaveBeenCalledTimes(2);
    expect(fetchAuthProviders).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Synced 5 ZFN messages")).toBeInTheDocument();
  });

  it("connects a ZFN mailbox through the connect form", async () => {
    render(<App />);

    openTab("System");
    fireEvent.click(await screen.findByRole("button", { name: /connect zfn/i }));

    fireEvent.change(screen.getByPlaceholderText(/zfn address/i), {
      target: { value: "matin1@uni-bremen.de" },
    });
    fireEvent.change(screen.getByPlaceholderText(/zfn username/i), {
      target: { value: "matin1" },
    });
    fireEvent.change(screen.getByPlaceholderText(/zfn password/i), {
      target: { value: "super-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save & verify/i }));

    await waitFor(() => {
      expect(connectZfn).toHaveBeenCalledWith({
        address: "matin1@uni-bremen.de",
        username: "matin1",
        password: "super-secret",
        imapHost: "imap.uni-bremen.de",
        imapPort: 993,
      });
    });
    expect(
      await screen.findByText("Connected matin1@uni-bremen.de"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/zfn address/i),
    ).not.toBeInTheDocument();
  });
});
