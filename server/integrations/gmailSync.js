import { buildReviewAction, classifyPriority } from "./mailMessage.js";

function headerValue(headers, name) {
  return (
    headers.find((header) => header.name.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

async function gmailRequest(accessToken, path) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Gmail API request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchRecentGmailMessages(accessToken, maxResults = 10) {
  const list = await gmailRequest(
    accessToken,
    `/users/me/messages?maxResults=${maxResults}&q=in:inbox newer_than:14d`,
  );
  const messages = list.messages ?? [];

  return Promise.all(
    messages.map(async (message) => {
      const detail = await gmailRequest(
        accessToken,
        `/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      );
      const headers = detail.payload?.headers ?? [];
      const sender = headerValue(headers, "From") || "Unknown sender";
      const subject = headerValue(headers, "Subject") || "(no subject)";
      const receivedAt = headerValue(headers, "Date")
        ? new Date(headerValue(headers, "Date")).toISOString()
        : new Date(Number(detail.internalDate)).toISOString();

      const normalized = {
        providerMessageId: detail.id,
        sender,
        subject,
        snippet: detail.snippet ?? "",
        action: "Review",
        priority: 0,
        receivedAt,
        rawMetadata: {
          threadId: detail.threadId,
          labelIds: detail.labelIds ?? [],
        },
      };

      const priority = classifyPriority(normalized);
      return {
        ...normalized,
        priority,
        action: buildReviewAction({ ...normalized, priority }),
      };
    }),
  );
}
