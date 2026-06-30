const urgentWords = [
  "urgent",
  "deadline",
  "rechnung",
  "invoice",
  "exam",
  "pruefung",
  "prüfung",
  "frist",
];

export function classifyPriority(message) {
  const subject = message.subject.toLowerCase();
  const sender = message.sender.toLowerCase();
  return urgentWords.some((word) => subject.includes(word) || sender.includes(word))
    ? 1
    : 0;
}

export function buildReviewAction(message) {
  return message.priority > 0 ? "Review today" : "Review";
}
