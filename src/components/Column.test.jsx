import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Column from "./Column";

// These tests cover the reusable column UI: adding tasks, starting drags,
// and hiding the add form when a column is read-only.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Column", () => {
  // Verifies the input submits a new task when the user presses Enter.
  it("calls onAddTask when Enter is pressed", () => {
    const onAddTask = vi.fn();

    render(
      <Column
        title="To Do"
        tasks={[]}
        onAddTask={onAddTask}
        onDragStart={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Add a task..."), {
      target: { value: "Learn React" },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("Add a task..."), {
      key: "Enter",
    });

    expect(onAddTask).toHaveBeenCalledWith("Learn React", "To Do");
  });

  // Verifies each task card reports its id when dragging begins.
  it("calls onDragStart when a task starts dragging", () => {
    const onDragStart = vi.fn();

    render(
      <Column
        title="Done"
        tasks={[{ id: 7, title: "Ship feature" }]}
        onDragStart={onDragStart}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
      />,
    );

    fireEvent.dragStart(screen.getByText("Ship feature"));

    expect(onDragStart).toHaveBeenCalledWith(7);
  });

  // Verifies blank submissions are ignored instead of creating empty tasks.
  it("does not call onAddTask for empty input", () => {
    const onAddTask = vi.fn();

    render(
      <Column
        title="To Do"
        tasks={[]}
        onAddTask={onAddTask}
        onDragStart={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "+" }));

    expect(onAddTask).not.toHaveBeenCalled();
  });

  // Verifies the add form is only shown for columns that support creation.
  it("hides the add task form when onAddTask is not provided", () => {
    render(
      <Column
        title="Done"
        tasks={[]}
        onDragStart={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
      />,
    );

    expect(
      screen.queryByPlaceholderText("Add a task..."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+" })).not.toBeInTheDocument();
  });
});
