import { ImapFlow } from "imapflow";
import { buildReviewAction, classifyPriority } from "./mailMessage.js";

function formatAddress(addresses = []) {
  const address = addresses[0];
  if (!address) return "Unknown sender";
  if (address.name && address.address) return `${address.name} <${address.address}>`;
  return address.address ?? address.name ?? "Unknown sender";
}

function toIsoDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function normalizeImapMessage(message) {
  const sender = formatAddress(message.envelope?.from);
  const subject = message.envelope?.subject || "(no subject)";
  const receivedAt = toIsoDate(message.envelope?.date ?? message.internalDate);
  const normalized = {
    providerMessageId:
      message.envelope?.messageId || `zfn:${message.uid ?? message.seq}`,
    sender,
    subject,
    snippet: "",
    action: "Review",
    priority: 0,
    receivedAt,
    rawMetadata: {
      uid: message.uid,
      seq: message.seq,
      flags: Array.from(message.flags ?? []),
      messageId: message.envelope?.messageId ?? null,
    },
  };
  const priority = classifyPriority(normalized);
  return {
    ...normalized,
    priority,
    action: buildReviewAction({ ...normalized, priority }),
  };
}

function createClient({ host, port, username, password }) {
  return new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: {
      user: username,
      pass: password,
    },
    logger: false,
  });
}

export async function verifyImapConnection({ host, port, username, password }) {
  const client = createClient({ host, port, username, password });

  await client.connect();
  await client.logout();

  return true;
}

export async function fetchRecentZfnMessages(connection, maxResults = 10) {
  const client = createClient(connection);

  await client.connect();
  try {
    const mailbox = await client.mailboxOpen("INBOX", { readOnly: true });
    if (!mailbox.exists) return [];

    const start = Math.max(mailbox.exists - maxResults + 1, 1);
    const messages = [];
    for await (const message of client.fetch(`${start}:*`, {
      envelope: true,
      flags: true,
      internalDate: true,
      uid: true,
    })) {
      messages.push(normalizeImapMessage(message));
    }

    return messages
      .toSorted((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
      .slice(0, maxResults);
  } finally {
    await client.logout();
  }
}
