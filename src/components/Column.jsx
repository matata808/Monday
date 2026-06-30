import { useState } from "react";

/**
 * Renders one kanban column.
 *
 * Props:
 * - title: the column name shown in the header
 * - tasks: the tasks that belong to this column
 * - onAddTask: optional callback for creating a new task
 * - onDragStart: callback for starting a drag action
 * - onDragOver: callback for allowing drops on the column
 * - onDrop: callback for finishing a drop on the column
 */
function Column({ title, tasks, onAddTask, onDragStart, onDragOver, onDrop }) {
  const [input, setInput] = useState("");

  /**
   * Sends a new task title to App and clears the input field.
   * Empty values are ignored so we do not create blank tasks.
   */
  function handleAdd() {
    if (input.trim() === "") return;
    onAddTask(input, title);
    setInput("");
  }

  return (
    <div
      className="min-h-96 rounded-lg border border-[#ded7c7] bg-white p-4 shadow-sm"
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop(title);
      }}
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1f2933]">
        {title}
        <span className="text-sm font-normal text-[#706b62]">
          ({tasks.length})
        </span>
      </h2>

      {/* Task cards are draggable so they can be moved between columns. */}
      <div className="flex flex-col gap-2 mb-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={() => {
              onDragStart(task.id);
            }}
            className="rounded-lg border border-[#e4dece] bg-[#fbfaf6] p-3 shadow-sm"
          >
            <p className="text-sm text-[#343434]">{task.title}</p>
          </div>
        ))}
      </div>

      {/* The add-task form only appears when this column supports new tasks. */}
      {onAddTask && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a task..."
            className="flex-1 rounded-lg border border-[#d8d1c1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#48635c]"
          />
          <button
            onClick={handleAdd}
            className="rounded-lg bg-[#253f3a] px-3 py-2 text-sm text-white hover:bg-[#345a52]"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default Column;
