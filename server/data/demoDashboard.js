export const demoDashboard = {
  tasks: [
    { id: 1, title: "Review inbox deadlines", status: "To Do" },
    { id: 2, title: "Pick one deep-work task", status: "In Progress" },
    { id: 3, title: "Write yesterday's shutdown note", status: "Done" },
  ],
  mailAccounts: [
    {
      id: "zfn",
      name: "ZFN Webmail",
      address: "webmail.de",
      inboxUrl: "https://webmail.zfn.uni-bremen.de/",
      unread: 8,
      priority: 2,
      lastChecked: "Demo brief",
      nextAction: "Connect ZFN IMAP to replace this with live university mail.",
      threads: [
        {
          id: 101,
          from: "Uni services",
          subject: "Account and enrollment updates",
          action: "Open before noon",
        },
        {
          id: 102,
          from: "ZFN support",
          subject: "Service messages and access notices",
          action: "Skim for deadlines",
        },
      ],
    },
    {
      id: "gmail",
      name: "Gmail.de",
      address: "gmail.de",
      inboxUrl: "https://mail.google.com/",
      unread: 5,
      priority: 1,
      lastChecked: "Demo brief",
      nextAction: "Connect Google OAuth to sync Gmail metadata.",
      threads: [
        {
          id: 201,
          from: "Personal inbox",
          subject: "Replies that need a same-day answer",
          action: "Reply after planning block",
        },
        {
          id: 202,
          from: "Receipts",
          subject: "Purchases, invoices, and confirmations",
          action: "Archive after review",
        },
      ],
    },
  ],
  journalEntries: [],
};
