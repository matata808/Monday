const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path, options) {
  const headers = {
    ...(options?.headers ?? {}),
  };

  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const issues = body?.issues?.map((issue) => issue.message).join(", ");
    throw new Error(
      issues || body?.message || body?.error || `API request failed: ${response.status}`,
    );
  }

  return response.json();
}

export async function fetchDashboard() {
  return request("/api/dashboard");
}

export async function fetchAuthProviders() {
  return request("/api/auth/providers");
}

export async function fetchWeather() {
  return request("/api/weather");
}

export async function fetchCalendar() {
  return request("/api/calendar/upcoming");
}

export async function createTask(task) {
  return request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateTask(taskId, updates) {
  return request(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(taskId) {
  return request(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function createBoard(board) {
  return request("/api/boards", {
    method: "POST",
    body: JSON.stringify(board),
  });
}

export async function deleteBoard(boardId) {
  return request(`/api/boards/${boardId}`, {
    method: "DELETE",
  });
}

export async function createSubtask(taskId, subtask) {
  return request(`/api/tasks/${taskId}/subtasks`, {
    method: "POST",
    body: JSON.stringify(subtask),
  });
}

export async function updateSubtask(subtaskId, updates) {
  return request(`/api/subtasks/${subtaskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteSubtask(subtaskId) {
  return request(`/api/subtasks/${subtaskId}`, {
    method: "DELETE",
  });
}

export async function createJournalEntry(entry) {
  return request("/api/journal", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function syncGmail() {
  return request("/api/sync/gmail", {
    method: "POST",
  });
}

export async function syncZfn() {
  return request("/api/sync/zfn", {
    method: "POST",
  });
}

export async function connectZfn(connection) {
  return request("/api/mail-accounts/zfn", {
    method: "POST",
    body: JSON.stringify(connection),
  });
}
