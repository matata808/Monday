import { z } from "zod";
import { config, getRuntimeCapabilities } from "../config.js";
import { getPool, hasDatabase } from "../db/client.js";
import { getSqliteDb } from "../db/sqlite.js";
import { fetchRecentGmailMessages } from "../integrations/gmailSync.js";
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  gmailScopes,
  readGoogleProfile,
  refreshGoogleAccessToken,
} from "../integrations/googleOAuth.js";
import {
  fetchRecentZfnMessages,
  verifyImapConnection,
} from "../integrations/zfnImap.js";
import {
  getLatestPostgresGoogleOAuthAccount,
  getLatestPostgresZfnAccount,
  upsertPostgresGoogleAccount,
  upsertPostgresMailMessages,
  upsertPostgresZfnAccount,
  upsertPostgresZfnMailMessages,
} from "../repositories/postgresDashboard.js";
import {
  getLatestGoogleOAuthAccount,
  getLatestZfnAccount,
  upsertGoogleAccount,
  upsertMailMessages,
  upsertZfnAccount,
  upsertZfnMailMessages,
} from "../repositories/sqliteDashboard.js";

const zfnConnectionSchema = z.object({
  address: z.string().email(),
  imapHost: z.string().trim().min(1),
  imapPort: z.number().int().positive().default(993),
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function authRoutes(fastify) {
  fastify.get("/api/auth/providers", async () => ({
    capabilities: getRuntimeCapabilities(),
    providers: [
      {
        id: "google",
        name: "Google Gmail",
        type: "oauth2",
        configured: getRuntimeCapabilities().googleOAuth,
        scopes: gmailScopes,
      },
      {
        id: "zfn",
        name: "ZFN Webmail",
        type: "imap",
        configured: getRuntimeCapabilities().zfnImap,
        host: config.zfn.imapHost,
        port: config.zfn.imapPort,
      },
    ],
  }));

  fastify.get(
    "/api/auth/google/start",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (_request, reply) => {
      if (!getRuntimeCapabilities().googleOAuth) {
        return reply.code(501).send({
          error: "Google OAuth is not configured",
          requiredEnv: [
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "GOOGLE_REDIRECT_URI",
          ],
        });
      }

      return reply.redirect(buildGoogleAuthUrl());
    },
  );

  fastify.get(
    "/api/auth/google/callback",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      if (!request.query?.code) {
        return reply.code(400).send({ error: "Missing OAuth code" });
      }

      if (!getRuntimeCapabilities().googleOAuth) {
        return reply.code(501).send({
          error: "Google OAuth is not configured",
        });
      }

      const tokens = await exchangeGoogleCode(request.query.code);
      const profile = await readGoogleProfile(tokens.id_token);
      const account = hasDatabase()
        ? await upsertPostgresGoogleAccount(getPool(), { profile, tokens })
        : upsertGoogleAccount(getSqliteDb(), { profile, tokens });

      const redirectUrl = new URL(config.appUrl);
      redirectUrl.searchParams.set("gmail", "connected");
      redirectUrl.searchParams.set("account", account.email);
      return reply.redirect(redirectUrl.toString());
    },
  );

  fastify.post(
    "/api/sync/gmail",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (_request, reply) => {
      const account = hasDatabase()
        ? await getLatestPostgresGoogleOAuthAccount(getPool())
        : getLatestGoogleOAuthAccount(getSqliteDb());
      if (!account) {
        return reply.code(404).send({
          error: "No connected Gmail account",
          next: "Use /api/auth/google/start first.",
        });
      }

      let accessToken = account.accessToken;
      if (!accessToken && account.refreshToken) {
        const refreshed = await refreshGoogleAccessToken(account.refreshToken);
        accessToken = refreshed.access_token;
      }

      if (!accessToken) {
        return reply.code(409).send({
          error: "No usable Google access token",
          next: "Reconnect Gmail.",
        });
      }

      const messages = await fetchRecentGmailMessages(accessToken, 10);
      const saved = hasDatabase()
        ? await upsertPostgresMailMessages(getPool(), account.email, messages)
        : upsertMailMessages(getSqliteDb(), account.email, messages);

      return {
        status: "synced",
        account: account.email,
        saved,
      };
    },
  );

  fastify.post(
    "/api/mail-accounts/zfn",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const parsed = zfnConnectionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: "Invalid ZFN connection", issues: parsed.error.issues });
      }

      await verifyImapConnection({
        host: parsed.data.imapHost,
        port: parsed.data.imapPort,
        username: parsed.data.username,
        password: parsed.data.password,
      });

      const account = hasDatabase()
        ? await upsertPostgresZfnAccount(getPool(), parsed.data)
        : upsertZfnAccount(getSqliteDb(), parsed.data);

      return reply.code(201).send({
        status: "connected",
        verified: true,
        next: "Use POST /api/sync/zfn to import recent ZFN inbox messages.",
        connection: {
          id: account.id,
          address: parsed.data.address,
          imapHost: parsed.data.imapHost,
          imapPort: parsed.data.imapPort,
          username: parsed.data.username,
        },
      });
    },
  );

  fastify.post(
    "/api/sync/zfn",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (_request, reply) => {
      const account = hasDatabase()
        ? await getLatestPostgresZfnAccount(getPool())
        : getLatestZfnAccount(getSqliteDb());
      if (!account) {
        return reply.code(404).send({
          error: "No connected ZFN account",
          next: "Use POST /api/mail-accounts/zfn first.",
        });
      }

      if (!account.password) {
        return reply.code(409).send({
          error: "No usable ZFN credential",
          next: "Reconnect ZFN.",
        });
      }

      const messages = await fetchRecentZfnMessages(
        {
          host: account.imap_host,
          port: account.imap_port ?? config.zfn.imapPort,
          username: account.imap_username,
          password: account.password,
        },
        10,
      );
      const saved = hasDatabase()
        ? await upsertPostgresZfnMailMessages(getPool(), account.id, messages)
        : upsertZfnMailMessages(getSqliteDb(), account.id, messages);

      return {
        status: "synced",
        account: account.address,
        saved,
      };
    },
  );
}
