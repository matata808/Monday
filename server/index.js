import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { config, getRuntimeCapabilities } from "./config.js";
import { closeDb } from "./db/client.js";
import { closeSqliteDb } from "./db/sqlite.js";
import { authRoutes } from "./routes/auth.js";
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

  fastify.get("/api/health", async () => ({
    ok: true,
    capabilities: getRuntimeCapabilities(),
  }));

  fastify.register(authRoutes);
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
