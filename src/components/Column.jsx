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
      className="bg-white rounded-xl shadow p-4 flex-1 min-h-96"
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop(title);
      }}
    >
      <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        {title}
        <span className="text-sm text-gray-400 font-normal">
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
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm"
          >
            <p className="text-gray-700 text-sm">{task.title}</p>
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
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleAdd}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default Column;
