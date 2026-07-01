import { Icon } from "../../shared/Icon";

export function WeatherCard({ weather, weatherError }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Weather
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--foreground)]">
            {weather ? weather.location : "Today"}
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10">
          <Icon
            name={weather?.icon ?? "cloud"}
            className="h-7 w-7 text-[var(--primary)]"
          />
        </div>
      </div>
      {weather ? (
        <>
          <div className="flex items-end gap-3">
            <span className="font-display text-5xl font-semibold text-[var(--foreground)]">
              {weather.temperature}
              {weather.unit}
            </span>
            <span className="pb-1.5 text-sm text-[var(--muted-foreground)]">
              {weather.condition}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <WeatherMetric label="High / Low" value={`${weather.high}° / ${weather.low}°`} />
            <WeatherMetric label="Feels like" value={`${weather.feelsLike}°`} />
            <WeatherMetric label="Wind" value={`${weather.windSpeed} km/h`} />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          {weatherError || "Loading forecast..."}
        </p>
      )}
    </section>
  );
}

function WeatherMetric({ label, value }) {
  return (
    <div className="rounded-md bg-[var(--accent-soft)] p-2.5">
      <span className="text-[10px] text-[var(--muted-foreground)]">{label}</span>
      <p className="mt-1 font-mono text-xs font-medium text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
