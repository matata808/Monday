import { getPool, hasDatabase } from "../db/client.js";
import { getSqliteDb } from "../db/sqlite.js";
import { fetchUpcomingEvents } from "../integrations/googleCalendar.js";
import { refreshGoogleAccessToken } from "../integrations/googleOAuth.js";
import { getLatestPostgresGoogleOAuthAccount } from "../repositories/postgresDashboard.js";
import { getLatestGoogleOAuthAccount } from "../repositories/sqliteDashboard.js";

export async function calendarRoutes(fastify) {
  fastify.get(
    "/api/calendar/upcoming",
    {
      config: {
        rateLimit: {
          max: 30,
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
          error: "No connected Google account",
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

      try {
        const events = await fetchUpcomingEvents(accessToken);
        return {
          account: account.email,
          events,
        };
      } catch (error) {
        if (error.message.includes("403") || error.message.includes("401")) {
          return reply.code(409).send({
            error: "Calendar access not granted",
            next: "Reconnect Google to grant the calendar scope.",
          });
        }
        return reply.code(502).send({ error: error.message });
      }
    },
  );
}
