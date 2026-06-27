# My Kanban Board

This is a small React + Vite kanban board built for learning drag and drop, component state, and testing.

## How it works

The app keeps all tasks in one place inside [src/App.jsx](src/App.jsx). App is the single source of truth, which means every create or move action updates the same task list.

### App responsibilities

- `handleAddTask(title, status)`: creates a new task and adds it to the board.
- `handleDragStart(taskId)`: remembers which task is being dragged.
- `handleDragOver(event)`: calls `preventDefault()` so a column can accept drops.
- `handleDrop(targetStatus)`: moves the dragged task into the target column.

### Column responsibilities

The reusable column component lives in [src/components/Column.jsx](src/components/Column.jsx).

- It renders the tasks for one column.
- It makes each task card draggable.
- It shows the add-task input only when the column supports new tasks.
- It passes user actions back to App through props.

## Drag and drop flow

1. The user starts dragging a task card.
2. `handleDragStart` stores the task id in App state.
3. The user drags the card over a column.
4. `handleDragOver` allows the drop by preventing the browser default behavior.
5. The user releases the card on a column.
6. `handleDrop` updates that task’s `status` so it appears in the new column.

## Add task flow

Tasks can be created from the To Do column.

1. The user types a title.
2. Column calls `onAddTask(title, status)`.
3. App creates a new task object.
4. The new task is added to the board state.

## Testing

The project includes Vitest and React Testing Library coverage.

- `npm run test:run` runs the test suite once.
- `npm run test:coverage` prints the coverage report.

Current coverage is 100%.

## Scripts

- `npm run dev` starts the app in development mode.
- `npm run build` creates a production build.
- `npm run lint` checks the code with ESLint.
- `npm run test:run` runs the tests once.
- `npm run test:coverage` runs the tests with coverage.
