import { useState } from "react";
import Column from "./components/Column";

function App() {
  const [tasks, setTasks] = useState([
    // PLACEHOLDER! these are example tasks
    { id: 1, title: "Buy groceries", status: "To Do" },
    { id: 2, title: "Build kanban app", status: "In Progress" },
    { id: 3, title: "Go for a walk", status: "Done" },
  ]);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  /**
   * Stores the id of the task that just started dragging.
   * The drop handler uses this value to know which task to move.
   */
  function handleDragStart(taskId) {
    setDraggedTaskId(taskId);
  }

  /**
   * Allows a task to be dropped into a column.
   * The browser requires preventDefault() before it will accept the drop.
   */
  function handleDragOver(e) {
    e.preventDefault();
  }

  /**
   * Moves the dragged task into the target column.
   * If nothing is being dragged, the function does nothing.
   */
  function handleDrop(targetStatus, targetTaskId = null) {
    if (draggedTaskId === null) return;
    setTasks((previousTasks) => {
      const draggedTask = previousTasks.find(
        (task) => task.id === draggedTaskId,
      );
      if (!draggedTask) return previousTasks;
      const updatedDraggedTask = {
        ...draggedTask,
        status: targetStatus,
      };
      const tasksWithoutDragged = previousTasks.filter(
        (task) => task.id !== draggedTaskId,
      );
      if (targetTaskId === null || targetTaskId === draggedTaskId)
        return [...tasksWithoutDragged, updatedDraggedTask];
      const targetIndex = tasksWithoutDragged.findIndex(
        (task) => task.id === targetTaskId,
      );
      if (targetIndex === -1)
        return [...tasksWithoutDragged, updatedDraggedTask];
      return [
        ...tasksWithoutDragged.slice(0, targetIndex),
        updatedDraggedTask,
        ...tasksWithoutDragged.slice(targetIndex),
      ];
    });
    setDraggedTaskId(null);
  }

  /**
   * Adds a new task to the board.
   * New tasks are created in the status column that called the handler.
   */
  function handleAddTask(title, status) {
    setTasks((previousTasks) => [
      ...previousTasks,
      {
        id: Date.now(),
        title,
        status,
      },
    ]);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800">My Kanban Board</h1>
      <div className="flex flex-row gap-6 items-start ">
        <Column
          title="To Do"
          tasks={tasks.filter((task) => task.status === "To Do")}
          onAddTask={handleAddTask}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        <Column
          title="In Progress"
          tasks={tasks.filter((task) => task.status === "In Progress")}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        <Column
          title="Done"
          tasks={tasks.filter((task) => task.status === "Done")}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
}

export default App;
