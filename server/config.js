import { config as loadEnv } from "dotenv";

// .env.local wins over .env so `clerk env pull` output takes effect.
loadEnv({ path: [".env.local", ".env"], quiet: true });

function readNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.API_HOST ?? "127.0.0.1",
  port: readNumber("API_PORT", 8787),
  databaseUrl: process.env.DATABASE_URL ?? "",
  sqliteDatabasePath:
    process.env.SQLITE_DATABASE_PATH ?? "./data/dashboard.sqlite",
  appSecret: process.env.APP_SECRET ?? "",
  appUrl: process.env.APP_URL ?? "http://127.0.0.1:5173",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      "http://127.0.0.1:8787/api/auth/google/callback",
  },
  zfn: {
    imapHost: process.env.ZFN_IMAP_HOST ?? "",
    imapPort: readNumber("ZFN_IMAP_PORT", 993),
  },
  weather: {
    provider: process.env.WEATHER_API_PROVIDER ?? "open-meteo",
    apiKey: process.env.WEATHER_API_KEY ?? "",
    location: process.env.WEATHER_LOCATION ?? "Berlin,DE",
  },
  clerk: {
    publishableKey:
      process.env.CLERK_PUBLISHABLE_KEY ??
      process.env.VITE_CLERK_PUBLISHABLE_KEY ??
      "",
    secretKey: process.env.CLERK_SECRET_KEY ?? "",
  },
};

export function getRuntimeCapabilities() {
  return {
    database: Boolean(config.databaseUrl || config.sqliteDatabasePath),
    sqlite: Boolean(config.sqliteDatabasePath),
    postgres: Boolean(config.databaseUrl),
    googleOAuth: Boolean(config.google.clientId && config.google.clientSecret),
    zfnImap: Boolean(config.zfn.imapHost),
    weather: Boolean(config.weather.provider),
    clerkAuth: Boolean(config.clerk.publishableKey && config.clerk.secretKey),
  };
}
