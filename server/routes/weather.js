import { config, getRuntimeCapabilities } from "../config.js";

const CACHE_TTL_MS = 10 * 60 * 1000;

const weatherCodeConditions = {
  0: { label: "Clear sky", icon: "sun" },
  1: { label: "Mostly clear", icon: "sun" },
  2: { label: "Partly cloudy", icon: "cloud" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "cloud" },
  48: { label: "Rime fog", icon: "cloud" },
  51: { label: "Light drizzle", icon: "rain" },
  53: { label: "Drizzle", icon: "rain" },
  55: { label: "Dense drizzle", icon: "rain" },
  56: { label: "Freezing drizzle", icon: "rain" },
  57: { label: "Freezing drizzle", icon: "rain" },
  61: { label: "Light rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy rain", icon: "rain" },
  66: { label: "Freezing rain", icon: "rain" },
  67: { label: "Freezing rain", icon: "rain" },
  71: { label: "Light snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Heavy snow", icon: "snow" },
  77: { label: "Snow grains", icon: "snow" },
  80: { label: "Light showers", icon: "rain" },
  81: { label: "Showers", icon: "rain" },
  82: { label: "Heavy showers", icon: "rain" },
  85: { label: "Snow showers", icon: "snow" },
  86: { label: "Snow showers", icon: "snow" },
  95: { label: "Thunderstorm", icon: "storm" },
  96: { label: "Thunderstorm with hail", icon: "storm" },
  99: { label: "Thunderstorm with hail", icon: "storm" },
};

let cached = null;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Upstream weather request failed: ${response.status}`);
  }
  return response.json();
}

async function geocodeLocation(location) {
  const [name, countryCode] = location.split(",").map((part) => part.trim());
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const data = await fetchJson(url);
  const results = data.results ?? [];
  const match = countryCode
    ? (results.find(
        (result) =>
          result.country_code?.toUpperCase() === countryCode.toUpperCase(),
      ) ?? results[0])
    : results[0];
  if (!match) {
    throw new Error(`No geocoding result for location "${location}"`);
  }
  return match;
}

async function loadWeather(location) {
  const place = await geocodeLocation(location);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", place.latitude);
  url.searchParams.set("longitude", place.longitude);
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const forecast = await fetchJson(url);
  const condition =
    weatherCodeConditions[forecast.current?.weather_code] ?? {
      label: "Unknown",
      icon: "cloud",
    };

  return {
    location: [place.name, place.country_code].filter(Boolean).join(", "),
    temperature: Math.round(forecast.current?.temperature_2m ?? 0),
    feelsLike: Math.round(forecast.current?.apparent_temperature ?? 0),
    humidity: forecast.current?.relative_humidity_2m ?? null,
    windSpeed: Math.round(forecast.current?.wind_speed_10m ?? 0),
    condition: condition.label,
    icon: condition.icon,
    high: Math.round(forecast.daily?.temperature_2m_max?.[0] ?? 0),
    low: Math.round(forecast.daily?.temperature_2m_min?.[0] ?? 0),
    unit: forecast.current_units?.temperature_2m ?? "°C",
    updatedAt: new Date().toISOString(),
  };
}

export async function weatherRoutes(fastify) {
  fastify.get(
    "/api/weather",
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: "1 minute",
        },
      },
    },
    async (_request, reply) => {
      if (!getRuntimeCapabilities().weather) {
        return reply.code(501).send({
          error: "Weather is not configured",
          requiredEnv: ["WEATHER_API_PROVIDER", "WEATHER_LOCATION"],
        });
      }

      const location = config.weather.location;
      if (
        cached &&
        cached.location === location &&
        Date.now() - cached.at < CACHE_TTL_MS
      ) {
        return cached.payload;
      }

      try {
        const payload = await loadWeather(location);
        cached = { at: Date.now(), location, payload };
        return payload;
      } catch (error) {
        return reply.code(502).send({ error: error.message });
      }
    },
  );
}
