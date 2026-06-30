export function buildBriefingItems({
  activeBoard,
  apiState,
  journalEntries,
  mailAccounts,
  mailStats,
  taskStats,
  tasks,
}) {
  const nextTask = tasks.find((task) => task.status !== "Done");
  const connectedMail = mailAccounts.find((account) => account.address);
  const latestJournal = journalEntries[0];
  const servicesReady = [
    apiState.capabilities.database,
    apiState.capabilities.googleOAuth,
    apiState.capabilities.zfnImap,
  ].filter(Boolean).length;

  return [
    {
      id: "mail",
      category: "Inbox",
      source: connectedMail?.name ?? "Mail",
      detail: connectedMail?.address ?? "not connected",
      headline:
        mailStats.unread > 0
          ? `${mailStats.unread} synced mail items are ready to scan.`
          : "Connect Gmail and sync to populate your inbox brief.",
      urgent: mailStats.priority > 0,
    },
    {
      id: "tasks",
      category: "Tasks",
      source: activeBoard?.name ?? "Kanban",
      detail: `${taskStats.total} total`,
      headline: nextTask
        ? `Next useful task: ${nextTask.title}`
        : "Your board is empty. Add the first task for today.",
      urgent: (taskStats.byStatus["In Progress"] ?? 0) > 2,
    },
    {
      id: "journal",
      category: "Journal",
      source: latestJournal?.mood ?? "Reflection",
      detail: latestJournal?.date ?? "no entry",
      headline: latestJournal
        ? latestJournal.focus
        : "Write one sentence about what today needs from you.",
      urgent: false,
    },
    {
      id: "services",
      category: "System",
      source: apiState.status,
      detail: `${servicesReady}/3 ready`,
      headline: apiState.capabilities.sqlite
        ? "Local SQLite storage is active for tokens, tasks, boards, and subtasks."
        : "Dashboard is running in local fallback mode.",
      urgent: !apiState.capabilities.database,
    },
  ];
}

