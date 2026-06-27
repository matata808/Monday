import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import App from "./App";

// These tests cover the board-level behavior owned by App:
// initial rendering, creating tasks, and moving tasks between columns.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App", () => {
  // Verifies the board starts with the three sample tasks in the expected columns.
  it("renders the initial tasks in each column", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /to do/i })).toBeInTheDocument();
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Build kanban app")).toBeInTheDocument();
    expect(screen.getByText("Go for a walk")).toBeInTheDocument();
  });

  // Verifies that the add-task flow creates a new task in the To Do column.
  it("adds a task to the To Do column", () => {
    vi.spyOn(Date, "now").mockReturnValue(1234567890);

    render(<App />);

    const toDoColumn = screen
      .getAllByRole("heading")
      .find((heading) => heading.textContent?.includes("To Do"))?.parentElement;

    fireEvent.change(within(toDoColumn).getByPlaceholderText("Add a task..."), {
      target: { value: "Write tests" },
    });
    fireEvent.click(within(toDoColumn).getByRole("button", { name: "+" }));

    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });

  // Verifies that dragging a task into Done updates its status in board state.
  it("moves a task to another column when dropped", () => {
    render(<App />);

    const draggedTask = screen.getByText("Buy groceries").closest("div");
    const doneColumn = screen
      .getAllByRole("heading")
      .find((heading) => heading.textContent?.includes("Done"))?.parentElement;

    fireEvent.dragStart(draggedTask);
    fireEvent.dragOver(doneColumn);
    fireEvent.drop(doneColumn);

    const toDoColumn = screen
      .getAllByRole("heading")
      .find((heading) => heading.textContent?.includes("To Do"))?.parentElement;

    expect(
      within(toDoColumn).queryByText("Buy groceries"),
    ).not.toBeInTheDocument();
    expect(within(doneColumn).getByText("Buy groceries")).toBeInTheDocument();
  });

  // Verifies the same drag-and-drop behavior works when moving tasks backward.
  it("moves an In Progress task back to To Do when dropped", () => {
    render(<App />);

    const draggedTask = screen.getByText("Build kanban app").closest("div");
    const toDoColumn = screen
      .getAllByRole("heading")
      .find((heading) => heading.textContent?.includes("To Do"))?.parentElement;

    fireEvent.dragStart(draggedTask);
    fireEvent.dragOver(toDoColumn);
    fireEvent.drop(toDoColumn);

    expect(
      within(toDoColumn).getByText("Build kanban app"),
    ).toBeInTheDocument();
  });

  // Verifies the board ignores drops when nothing is actively being dragged.
  it("moves a Done task to In Progress when dropped", () => {
    render(<App />);

    const draggedTask = screen.getByText("Go for a walk").closest("div");
    const inProgressColumn = screen
      .getAllByRole("heading")
      .find((heading) =>
        heading.textContent?.includes("In Progress"),
      )?.parentElement;

    fireEvent.dragStart(draggedTask);
    fireEvent.dragOver(inProgressColumn);
    fireEvent.drop(inProgressColumn);

    expect(
      within(inProgressColumn).getByText("Go for a walk"),
    ).toBeInTheDocument();
  });

  // Verifies the no-op path so the board does not change on an empty drop.
  it("does nothing when a drop happens without an active dragged task", () => {
    render(<App />);

    const doneColumn = screen
      .getAllByRole("heading")
      .find((heading) => heading.textContent?.includes("Done"))?.parentElement;

    fireEvent.dragOver(doneColumn);
    fireEvent.drop(doneColumn);

    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Build kanban app")).toBeInTheDocument();
    expect(screen.getByText("Go for a walk")).toBeInTheDocument();
  });
});
