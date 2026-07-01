import { clerkPlugin, getAuth } from "@clerk/fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { config, getRuntimeCapabilities } from "./config.js";
import { closeDb } from "./db/client.js";
import { closeSqliteDb } from "./db/sqlite.js";
import { authRoutes } from "./routes/auth.js";
import { calendarRoutes } from "./routes/calendar.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { weatherRoutes } from "./routes/weather.js";

export function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === "test" ? "silent" : "info",
    },
  });

  fastify.register(cors, {
    origin: config.appUrl,
    credentials: true,
  });
  fastify.register(rateLimit, {
    global: false,
  });

  // Browser redirect flows cannot carry a Clerk session token.
  const publicApiPaths = new Set([
    "/api/health",
    "/api/auth/google/start",
    "/api/auth/google/callback",
  ]);

  if (getRuntimeCapabilities().clerkAuth) {
    fastify.register(clerkPlugin, {
      publishableKey: config.clerk.publishableKey,
      secretKey: config.clerk.secretKey,
    });
    fastify.addHook("preHandler", async (request, reply) => {
      const path = request.url.split("?")[0];
      if (!path.startsWith("/api/") || publicApiPaths.has(path)) return;
      const { userId } = getAuth(request);
      if (!userId) {
        return reply.code(401).send({ error: "Sign in required" });
      }
    });
  } else {
    fastify.log.warn(
      "Clerk keys missing; API running without authentication.",
    );
  }

  fastify.get("/api/health", async () => ({
    ok: true,
    capabilities: getRuntimeCapabilities(),
  }));

  fastify.register(authRoutes);
  fastify.register(calendarRoutes);
  fastify.register(dashboardRoutes);
  fastify.register(weatherRoutes);

  fastify.addHook("onClose", async () => {
    await closeDb();
    closeSqliteDb();
  });

  return fastify;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = buildServer();
  await server.listen({ host: config.host, port: config.port });
}
