import { ImapFlow } from "imapflow";

export async function verifyImapConnection({ host, port, username, password }) {
  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: {
      user: username,
      pass: password,
    },
    logger: false,
  });

  await client.connect();
  await client.logout();

  return true;
}
