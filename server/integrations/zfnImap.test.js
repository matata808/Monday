import { describe, expect, it } from "vitest";
import { normalizeImapMessage } from "./zfnImap.js";

describe("normalizeImapMessage", () => {
  it("maps IMAP envelope data into dashboard mail messages", () => {
    const message = normalizeImapMessage({
      uid: 42,
      seq: 3,
      flags: new Set(["\\Seen"]),
      internalDate: new Date("2026-06-30T07:00:00.000Z"),
      envelope: {
        messageId: "<zfn-message@example.test>",
        subject: "Exam registration deadline",
        date: new Date("2026-06-30T08:00:00.000Z"),
        from: [{ name: "ZFN Office", address: "office@example.test" }],
      },
    });

    expect(message).toEqual(
      expect.objectContaining({
        providerMessageId: "<zfn-message@example.test>",
        sender: "ZFN Office <office@example.test>",
        subject: "Exam registration deadline",
        action: "Review today",
        priority: 1,
        receivedAt: "2026-06-30T08:00:00.000Z",
      }),
    );
    expect(message.rawMetadata).toEqual(
      expect.objectContaining({
        uid: 42,
        seq: 3,
        flags: ["\\Seen"],
      }),
    );
  });
});
