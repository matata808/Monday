const deadlinePattern =
  /deadline|abgabe|anmeldung|frist|exam|klausur|prüfung|due|submission/i;

export async function fetchUpcomingEvents(accessToken, { days = 7, maxResults = 25 } = {}) {
  const timeMin = new Date();
  const timeMax = new Date(timeMin.getTime() + days * 24 * 60 * 60 * 1000);

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", String(maxResults));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Calendar API request failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.items ?? [])
    .filter((event) => event.status !== "cancelled")
    .map((event) => {
      const allDay = Boolean(event.start?.date);
      return {
        id: event.id,
        title: event.summary ?? "(no title)",
        start: event.start?.dateTime ?? event.start?.date ?? null,
        end: event.end?.dateTime ?? event.end?.date ?? null,
        allDay,
        location: event.location ?? "",
        link: event.htmlLink ?? "",
        deadline: deadlinePattern.test(
          `${event.summary ?? ""} ${event.description ?? ""}`,
        ),
      };
    });
}
