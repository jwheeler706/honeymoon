"use client";

import { useEffect, useState } from "react";
import itinerary from "./data/itinerary.json";

type EventStatus = "confirmed" | "pending" | "flexible" | "suggested" | "planned" | "assumed";
type EventType = "travel" | "lodging" | "activity" | "downtime" | "reservation" | "meal" | "excursion";

type TripEvent = {
  title: string;
  time: string | null;
  status: EventStatus;
  type: EventType;
  notes: string;
  provider?: string;
  location?: string;
  duration?: string;
  flight?: {
    number: string;
    airline: string;
    operatedBy?: string;
    aircraft: string;
    route: string;
    depart: string;
    arrive: string;
    cabin: string;
    seats: string;
    duration: string;
    layoverAfter?: string;
    baggageUrl?: string;
  };
  photoAttachments?: {
    enabled: false;
    futureKey: string;
  };
};

type Day = {
  date: string;
  weekday: string;
  title: string;
  status: EventStatus;
  theme: string;
  lodging?: string;
  summary: string;
  events: TripEvent[];
  transport: string;
  notes: string;
};

type Reservation = {
  date: string;
  time: string | null;
  name: string;
  type: string;
  status: EventStatus;
  notes: string;
  provider?: string;
  location?: string;
};

type TripData = typeof itinerary & {
  days: Day[];
  reservations: Reservation[];
};

type AppState = {
  activeDay: string;
  view: "plan" | "reservations" | "map" | "gallery";
  mapStart: string;
  mapEnd: string;
  selectedPlace: string;
  done: Record<string, boolean>;
  saved: Record<string, boolean>;
  notes: Record<string, string>;
  editor: "Jeff" | "Spouse";
};

const data = itinerary as TripData;
const storageKey = "rarotonga-honeymoon-itinerary-v1";
const tripTimeZone = data.trip.timezone || "Pacific/Rarotonga";

const initialState: AppState = {
  activeDay: data.days[0].date,
  view: "plan",
  mapStart: data.days[0].date,
  mapEnd: data.days[data.days.length - 1].date,
  selectedPlace: "sea-change-villas",
  done: {},
  saved: {},
  notes: {},
  editor: "Jeff",
};

const statusLabels: Record<EventStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  flexible: "Flexible",
  suggested: "Suggested",
  planned: "Planned",
  assumed: "Assumed",
};

const typeIcons: Record<EventType, string> = {
  travel: "✈",
  lodging: "⌂",
  activity: "◇",
  downtime: "☼",
  reservation: "◆",
  meal: "◐",
  excursion: "↗",
};

const periodLabels = ["Morning", "Afternoon", "Evening"] as const;
type Period = (typeof periodLabels)[number];
type TimeTheme = "morning" | "day" | "evening" | "night";
type HeaderKey =
  | "countdown"
  | "flight"
  | "turtle"
  | "aitutaki"
  | "nautilus"
  | "tamarind"
  | "otb"
  | "dinner"
  | "villa"
  | "beach"
  | "hike";

type HeaderContext = {
  key: HeaderKey;
  eyebrow: string;
  title: string;
  subtitle: string;
};

type MapPlace = {
  id: string;
  name: string;
  date: string;
  period: Period;
  status: EventStatus;
  type: EventType;
  area: string;
  note: string;
  x: number;
  y: number;
};

type GalleryImage = {
  id: string;
  title: string;
  date: string;
  label: string;
  image: string;
  alt: string;
  sourceUrl: string;
  sourceLabel: string;
};

const mapPlaces: MapPlace[] = [
  {
    id: "sea-change-villas",
    name: "Sea Change Villas",
    date: "2026-10-09",
    period: "Evening",
    status: "confirmed",
    type: "lodging",
    area: "Titikaveka",
    note: "Home base for slow mornings, villa time, and easy returns.",
    x: 64,
    y: 78,
  },
  {
    id: "punanga-nui-market",
    name: "Punanga Nui Market / Avarua",
    date: "2026-10-10",
    period: "Morning",
    status: "suggested",
    type: "activity",
    area: "Avarua",
    note: "Good first-morning option if the late arrival does not win.",
    x: 46,
    y: 32,
  },
  {
    id: "nautilus",
    name: "Nautilus Resort",
    date: "2026-10-10",
    period: "Evening",
    status: "confirmed",
    type: "reservation",
    area: "Muri",
    note: "Confirmed opening honeymoon dinner at 6:00 PM.",
    x: 76,
    y: 68,
  },
  {
    id: "tamarind",
    name: "Tamarind House main restaurant",
    date: "2026-10-11",
    period: "Evening",
    status: "confirmed",
    type: "reservation",
    area: "Avarua",
    note: "Confirmed dinner at 6:15 PM.",
    x: 47,
    y: 30,
  },
  {
    id: "black-rock",
    name: "Black Rock / west-side wandering",
    date: "2026-10-11",
    period: "Afternoon",
    status: "planned",
    type: "activity",
    area: "Northwest coast",
    note: "Driver-day scenic stop candidate.",
    x: 19,
    y: 31,
  },
  {
    id: "otb",
    name: "OTB / On the Beach",
    date: "2026-10-12",
    period: "Evening",
    status: "confirmed",
    type: "reservation",
    area: "West side",
    note: "Confirmed dinner; exact time TBD.",
    x: 14,
    y: 50,
  },
  {
    id: "turtles",
    name: "Swim With The Turtles Rarotonga",
    date: "2026-10-13",
    period: "Afternoon",
    status: "confirmed",
    type: "excursion",
    area: "Avaavaroa Passage / Takitumu",
    note: "Confirmed 2:30 PM snorkel with Snorkel Cook Islands.",
    x: 50,
    y: 84,
  },
  {
    id: "raemaru",
    name: "Raemaru Trek",
    date: "2026-10-14",
    period: "Morning",
    status: "flexible",
    type: "activity",
    area: "Arorangi",
    note: "Preferred hike option if weather and energy are right.",
    x: 27,
    y: 50,
  },
  {
    id: "antipodes",
    name: "Antipodes",
    date: "2026-10-14",
    period: "Evening",
    status: "pending",
    type: "reservation",
    area: "Northwest hills",
    note: "Pending for Oct 14 or Oct 15.",
    x: 20,
    y: 34,
  },
  {
    id: "muri-easy",
    name: "Muri casual options",
    date: "2026-10-15",
    period: "Evening",
    status: "suggested",
    type: "meal",
    area: "Muri",
    note: "Easy dinner option if the day stays open.",
    x: 76,
    y: 68,
  },
  {
    id: "aitutaki",
    name: "Aitutaki day trip",
    date: "2026-10-16",
    period: "Afternoon",
    status: "confirmed",
    type: "excursion",
    area: "Aitutaki",
    note: "Confirmed day trip; provider and timing details TBD.",
    x: 87,
    y: 18,
  },
];

const galleryImages: GalleryImage[] = [
  {
    id: "sea-change",
    title: "Sea Change Villas",
    date: "2026-10-09",
    label: "Home base",
    image:
      "https://static1.squarespace.com/static/63d3ff8f9022444b080ead34/t/63f40fba2764b604666ec0d1/1676939195062/Beach+Front+VillasDSC_7451.jpg?format=1500w",
    alt: "Beachfront villa and lagoon at Sea Change Villas in Rarotonga.",
    sourceUrl: "https://www.seachangevillas.com/gallery",
    sourceLabel: "Sea Change Villas",
  },
  {
    id: "nautilus",
    title: "Nautilus Resort",
    date: "2026-10-10",
    label: "Opening dinner",
    image:
      "https://images.squarespace-cdn.com/content/v1/68d84e7615147738b7ee4fee/66fcfb58-3e1f-4e7a-acda-558e02f3fd85/NavigateNautilusResortPolynesianRestaurantPool.webp?format=1500w",
    alt: "Nautilus Resort pool and restaurant beside Muri Lagoon.",
    sourceUrl: "https://www.nautilusresortrarotonga.com/gallery/",
    sourceLabel: "Nautilus Resort",
  },
  {
    id: "tamarind",
    title: "Tamarind House",
    date: "2026-10-11",
    label: "Dinner",
    image:
      "https://images.squarespace-cdn.com/content/v1/63d3ff8f9022444b080ead34/42664d02-a318-46ff-b33b-38e7ecf18c39/tamarind%2Brestaurant%2Brarotonga.jpg",
    alt: "Sunset dining setting at Tamarind House in Rarotonga.",
    sourceUrl: "https://www.seachangevillas.com/island-time/best-restaurants-rarotonga-special-occasion",
    sourceLabel: "Sea Change Villas guide",
  },
  {
    id: "otb",
    title: "OTB",
    date: "2026-10-12",
    label: "Beach dinner",
    image: "https://enjoycookislands.com/uploads/general/_1200x630_crop_center-center_82_none_ns/OTB-1.jpeg?mtime=1469048986",
    alt: "Beachfront dining room at OTB in Rarotonga.",
    sourceUrl: "https://enjoycookislands.com/eat-drink/beaches-restaurant-bar",
    sourceLabel: "Enjoy Cook Islands",
  },
  {
    id: "turtles",
    title: "Swim With The Turtles",
    date: "2026-10-13",
    label: "Snorkel",
    image:
      "https://static1.squarespace.com/static/5e6f0f42668a2e3fcf7b19a4/t/6a3fd4e916d56f3a046e56ee/1782568169078/29AugSCIphotos-13.jpg?format=1500w",
    alt: "Sea turtle underwater during a Snorkel Cook Islands excursion.",
    sourceUrl: "https://www.snorkelcookislands.com/photos",
    sourceLabel: "Snorkel Cook Islands",
  },
  {
    id: "aitutaki",
    title: "Aitutaki",
    date: "2026-10-16",
    label: "Day trip",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Aitutaki_aerialview.jpg",
    alt: "Aerial view of Aitutaki lagoon.",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Aitutaki_aerialview.jpg",
    sourceLabel: "Wikimedia Commons",
  },
];

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T12:00:00Z`));
}

function formatLongDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T12:00:00Z`));
}

function formatTime(time: string | null) {
  if (!time) return "Time TBD";
  if (time === "morning" || time === "afternoon" || time === "daytime" || time === "evening") {
    return time[0].toUpperCase() + time.slice(1);
  }

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(Date.UTC(2026, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function eventKey(day: Day, event: TripEvent) {
  return `${day.date}-${event.title}`;
}

function mainAnchor(day: Day) {
  return (
    day.events.find((event) => event.status === "confirmed" && event.type === "reservation") ??
    day.events.find((event) => event.status === "confirmed") ??
    day.events[0]
  );
}

function rarotongaHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: tripTimeZone,
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === "hour")?.value ?? 0);
}

function currentTimeTheme(date = new Date()): TimeTheme {
  const hour = rarotongaHour(date);
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function formatRarotongaTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tripTimeZone,
  }).format(date);
}

function rarotongaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: tripTimeZone,
    year: "numeric",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function countdownText(now = new Date()) {
  const tripStart = new Date(`${data.trip.startDate}T00:00:00-10:00`);
  const difference = tripStart.getTime() - now.getTime();
  const days = Math.max(0, Math.ceil(difference / 86_400_000));

  if (days === 0) return "Honeymoon starts today";
  if (days === 1) return "1 day to Rarotonga";
  return `${days} days to Rarotonga`;
}

function themeLabel(theme: TimeTheme) {
  const labels: Record<TimeTheme, string> = {
    morning: "Lagoon morning",
    day: "Warm island day",
    evening: "Golden evening",
    night: "Quiet island night",
  };

  return labels[theme];
}

function headerLabel(header: HeaderContext, theme: TimeTheme) {
  if (header.key === "countdown") return "Trip countdown";
  return themeLabel(theme);
}

function eventPeriod(event: TripEvent): Period {
  if (event.time === "morning") return "Morning";
  if (event.time === "afternoon" || event.time === "daytime") return "Afternoon";
  if (event.time === "evening") return "Evening";
  if (!event.time) return event.type === "meal" || event.type === "reservation" ? "Evening" : "Afternoon";

  const hour = Number(event.time.split(":")[0]);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function eventStartMinutes(event: TripEvent) {
  if (event.time === "morning") return 8 * 60;
  if (event.time === "daytime") return 11 * 60;
  if (event.time === "afternoon") return 14 * 60;
  if (event.time === "evening") return 18 * 60;
  if (!event.time) return event.type === "lodging" ? 22 * 60 : 18 * 60;

  const [hours, minutes] = event.time.split(":").map(Number);
  return hours * 60 + minutes;
}

function headerKeyForEvent(event: TripEvent): HeaderKey {
  const title = event.title.toLowerCase();
  if (title.includes("turtle")) return "turtle";
  if (title.includes("aitutaki")) return "aitutaki";
  if (title.includes("nautilus")) return "nautilus";
  if (title.includes("tamarind")) return "tamarind";
  if (title.includes("otb") || title.includes("on the beach")) return "otb";
  if (event.flight || event.type === "travel") return "flight";
  if (title.includes("sea change") || event.type === "lodging" || event.type === "downtime") return "villa";
  if (title.includes("hike") || title.includes("trek")) return "hike";
  if (event.type === "reservation" || event.type === "meal") return "dinner";
  return "beach";
}

function currentTripEvent(now = new Date()) {
  const { date, minutes } = rarotongaDateParts(now);
  const day = data.days.find((tripDay) => tripDay.date === date);
  if (!day) return null;

  const events = [...day.events].sort((a, b) => eventStartMinutes(a) - eventStartMinutes(b));
  const current = [...events].reverse().find((event) => eventStartMinutes(event) <= minutes);

  return {
    day,
    event: current ?? events[0],
  };
}

function headerContext(now = new Date()): HeaderContext {
  const tripStart = new Date(`${data.trip.startDate}T00:00:00-10:00`);
  const tripEnd = new Date("2026-10-18T00:00:00-10:00");

  if (now < tripStart) {
    return {
      key: "countdown",
      eyebrow: `Time in Rarotonga · ${formatRarotongaTime(now)}`,
      title: countdownText(now),
      subtitle: "Honeymoon itinerary · Oct 9-17",
    };
  }

  const current = currentTripEvent(now);

  if (now >= tripEnd || !current) {
    return {
      key: "beach",
      eyebrow: `Time in Rarotonga · ${formatRarotongaTime(now)}`,
      title: "Rarotonga",
      subtitle: "Honeymoon itinerary · Oct 9-17",
    };
  }

  return {
    key: headerKeyForEvent(current.event),
    eyebrow: `Time in Rarotonga · ${formatRarotongaTime(now)}`,
    title: current.event.title,
    subtitle: `${formatTime(current.event.time)} · ${current.day.title}`,
  };
}

function periodTone(day: Day, period: Period) {
  const tones: Record<string, Partial<Record<Period, string>>> = {
    "2026-10-09": {
      Evening: "Arrive, exhale, and keep the night simple.",
    },
    "2026-10-10": {
      Morning: "Ease into the island if you are feeling fresh.",
      Afternoon: "Leave room for villa time before dinner.",
      Evening: "First proper honeymoon dinner.",
    },
    "2026-10-11": {
      Morning: "Let the driver day unfold without rushing.",
      Afternoon: "Scenic stops, beach time, and an easy reset before dinner.",
      Evening: "Tamarind House main restaurant.",
    },
    "2026-10-12": {
      Afternoon: "West-side beach day with a sunset dinner shape.",
      Evening: "OTB is confirmed; exact time can slide in later.",
    },
    "2026-10-13": {
      Morning: "Easy morning at the villa.",
      Afternoon: "Turtle snorkel is the main moment.",
      Evening: "Chill night after the water.",
    },
    "2026-10-14": {
      Morning: "Flexible start based on weather and energy.",
      Afternoon: "Adventure window if it feels right.",
      Evening: "Antipodes may land here.",
    },
    "2026-10-15": {
      Morning: "Slow honeymoon morning.",
      Afternoon: "Beach, lagoon, villa, or a flexible hike.",
      Evening: "Antipodes may land here, otherwise keep it easy.",
    },
    "2026-10-16": {
      Morning: "Aitutaki day trip begins when the provider details are known.",
      Afternoon: "Let the excursion own the day.",
      Evening: "Very casual dinner after a big day.",
    },
    "2026-10-17": {
      Morning: "Final slow morning and packing.",
      Afternoon: "Keep departure logistics easy.",
    },
  };

  return tones[day.date]?.[period] ?? "Open space for whatever feels good.";
}

export default function Home() {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return initialState;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return initialState;

    try {
      return { ...initialState, ...(JSON.parse(saved) as Partial<AppState>) };
    } catch {
      window.localStorage.removeItem(storageKey);
      return initialState;
    }
  });
  const [timeTheme, setTimeTheme] = useState<TimeTheme>(() => currentTimeTheme());
  const [header, setHeader] = useState<HeaderContext>(() => headerContext());

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      setTimeTheme(currentTimeTheme(now));
      setHeader(headerContext(now));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeDay = data.days.find((day) => day.date === state.activeDay) ?? data.days[0];
  const anchor = mainAnchor(activeDay);

  function updateState(update: Partial<AppState>) {
    setState((current) => ({ ...current, ...update }));
  }

  function toggleDone(key: string) {
    setState((current) => ({
      ...current,
      done: {
        ...current.done,
        [key]: !current.done[key],
      },
    }));
  }

  function updateNote(key: string, value: string) {
    setState((current) => ({
      ...current,
      notes: {
        ...current.notes,
        [key]: value,
      },
    }));
  }

  return (
    <main className={`app-shell theme-${timeTheme}`}>
      <section className={`top-panel header-${header.key}`} aria-labelledby="trip-title">
        <div className="title-block">
          <p>{headerLabel(header, timeTheme)} · {header.eyebrow}</p>
          <h1 id="trip-title">{header.title}</h1>
          <span>{header.subtitle}</span>
        </div>
      </section>

      <section className="day-picker" aria-label="Choose itinerary day">
        <label>
          Day
          <select
            onChange={(event) => updateState({ activeDay: event.target.value, view: "plan" })}
            value={activeDay.date}
          >
            {data.days.map((day) => (
              <option key={day.date} value={day.date}>
                {formatDate(day.date)} · {day.weekday} · {day.title}
              </option>
            ))}
          </select>
        </label>
        <p>{anchor.title} · {formatTime(anchor.time)}</p>
      </section>

      <section className="control-row" aria-label="App views">
        {(["plan", "reservations", "map", "gallery"] as const).map((view) => (
          <button
            className={state.view === view ? "filter-pill active" : "filter-pill"}
            key={view}
            onClick={() => updateState({ view })}
            type="button"
          >
            {view === "plan"
              ? "Today"
              : view === "reservations"
                ? "Reservations"
                : view === "map"
                  ? "Map"
                  : "Gallery"}
          </button>
        ))}
      </section>

      {state.view === "reservations" ? (
        <ReservationsView reservations={data.reservations} />
      ) : state.view === "map" ? (
        <MapView
          endDate={state.mapEnd}
          onDateRangeChange={(mapStart, mapEnd) => updateState({ mapStart, mapEnd })}
          onSelectPlace={(selectedPlace) => updateState({ selectedPlace })}
          places={mapPlaces}
          selectedPlaceId={state.selectedPlace}
          startDate={state.mapStart}
        />
      ) : state.view === "gallery" ? (
        <GalleryView images={galleryImages} />
      ) : (
        <section className="itinerary-layout compact">
          <section className="day-detail" aria-labelledby="active-day-title">
            <div className="day-heading">
              <div>
                <span className="date-kicker">{formatLongDate(activeDay.date)}</span>
                <h2 id="active-day-title">{activeDay.title}</h2>
                <p>{activeDay.summary}</p>
              </div>
              <div className="day-meta">
                <span className={`status-badge ${activeDay.status}`}>{statusLabels[activeDay.status]}</span>
              </div>
            </div>

            <div className="transport-note">
              <span>Transport</span>
              <p>{activeDay.transport}</p>
            </div>

            <div className="period-stack">
              {periodLabels.map((period) => {
                const events = activeDay.events.filter((event) => eventPeriod(event) === period);
                return (
                  <section className="period-section" key={period} aria-label={period}>
                    <div className="period-heading">
                      <h3>{period}</h3>
                      {events.length ? null : <p>{periodTone(activeDay, period)}</p>}
                    </div>

                    {events.length ? (
                      <div className="timeline">
                        {events.map((event) => {
                          const key = eventKey(activeDay, event);
                          return (
                            <article className="event-card" key={key}>
                              <div className="event-main">
                                <button
                                  aria-label={state.done[key] ? `Mark ${event.title} not done` : `Mark ${event.title} done`}
                                  aria-pressed={Boolean(state.done[key])}
                                  className="done-dot"
                                  onClick={() => toggleDone(key)}
                                  type="button"
                                />
                                <div>
                                  <div className="event-topline">
                                    <time>{formatTime(event.time)}</time>
                                    <span className={`status-badge ${event.status}`}>
                                      {statusLabels[event.status]}
                                    </span>
                                  </div>
                                  <h4>{event.title}</h4>
                                  <p>{event.notes}</p>
                                  <EventDetails event={event} />
                                </div>
                              </div>

                              <details className="event-note">
                                <summary>Trip note</summary>
                                <textarea
                                  onChange={(eventTarget) => updateNote(key, eventTarget.target.value)}
                                  placeholder="Add a quick note."
                                  value={state.notes[key] ?? ""}
                                />
                              </details>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                    <Recommendations day={activeDay} period={period} />
                  </section>
                );
              })}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

function GalleryView({ images }: { images: GalleryImage[] }) {
  return (
    <section className="gallery-view" aria-labelledby="gallery-title">
      <div className="gallery-header">
        <p className="section-label">Trip pictures</p>
        <h2 id="gallery-title">Confirmed plans, one calm image each</h2>
      </div>
      <div className="gallery-grid">
        {images.map((image) => (
          <article className="gallery-card" key={image.id}>
            <img alt={image.alt} loading="lazy" src={image.image} />
            <div>
              <span>{formatDate(image.date)} · {image.label}</span>
              <h3>{image.title}</h3>
              <a href={image.sourceUrl} rel="noreferrer" target="_blank">
                Image source: {image.sourceLabel}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EventDetails({ event }: { event: TripEvent }) {
  if (event.flight) {
    return <FlightDetails event={event} />;
  }

  const details = [
    event.provider ? ["Provider", event.provider] : null,
    event.location ? ["Location", event.location] : null,
    event.duration ? ["Duration", event.duration] : null,
  ].filter(Boolean) as [string, string][];

  if (!details.length) return null;

  return (
    <dl className="event-details">
      {details.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FlightDetails({ event }: { event: TripEvent }) {
  const flight = event.flight;
  if (!flight) return null;

  return (
    <div className="flight-card">
      <div>
        <strong>{flight.route}</strong>
        <span>{flight.depart} - {flight.arrive}</span>
      </div>
      <dl>
        <div>
          <dt>Flight</dt>
          <dd>{flight.number}</dd>
        </div>
        <div>
          <dt>Seats</dt>
          <dd>{flight.seats}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{flight.duration}</dd>
        </div>
      </dl>
      <p>{flight.airline} · {flight.aircraft}</p>
      {flight.baggageUrl ? (
        <a href={flight.baggageUrl} rel="noreferrer" target="_blank">
          Baggage fees
        </a>
      ) : null}
      {flight.layoverAfter ? <span className="layover-pill">{flight.layoverAfter}</span> : null}
    </div>
  );
}

function Recommendations({ day, period }: { day: Day; period: Period }) {
  const options: Record<string, Partial<Record<Period, string[]>>> = {
    "2026-10-10": {
      Morning: ["Punanga Nui Market", "Coffee in Avarua", "Sleep in if needed"],
      Afternoon: ["Villa pool", "Titikaveka lagoon", "Easy pre-dinner reset"],
    },
    "2026-10-11": {
      Morning: ["Aroa Beach", "Black Rock", "Scenic driver loop"],
      Afternoon: ["Beach drink stop", "Arorangi wandering", "Back to change before dinner"],
    },
    "2026-10-12": {
      Morning: ["West-side snorkel", "Slow breakfast", "Beach bag day"],
      Afternoon: ["Lagoon time", "Sunset timing", "No-rush return"],
    },
    "2026-10-13": {
      Morning: ["Villa breakfast", "Titikaveka swim", "Charlie's for early lunch"],
      Evening: ["Takeaway", "Muri casual food", "Quiet villa night"],
    },
    "2026-10-14": {
      Morning: ["Raemaru Trek", "Beach instead if cloudy", "Coffee and no agenda"],
      Afternoon: ["Villa recovery", "Short island drive", "Antipodes prep if confirmed"],
      Evening: ["Antipodes if confirmed", "Sunset drink", "Simple dinner"],
    },
    "2026-10-15": {
      Morning: ["Slow villa morning", "Lagoon float", "Raemaru if not done"],
      Afternoon: ["Protected downtime", "Muri wander", "Beach nap"],
      Evening: ["Antipodes if confirmed", "Night market if it lines up", "Chill dinner"],
    },
    "2026-10-16": {
      Evening: ["Low-effort dinner", "Early night", "Save the stories"],
    },
    "2026-10-17": {
      Morning: ["Final swim", "Pack slowly", "One last coffee"],
    },
  };

  const items = (options[day.date]?.[period] ?? []).slice(0, 2);
  if (!items.length) return null;

  return (
    <div className="recommendations" aria-label={`${period} recommendations`}>
      <span>Good loose options</span>
      <div>
        {items.map((item) => (
          <button key={item} type="button">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function MapView({
  endDate,
  onDateRangeChange,
  onSelectPlace,
  places,
  selectedPlaceId,
  startDate,
}: {
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onSelectPlace: (placeId: string) => void;
  places: MapPlace[];
  selectedPlaceId: string;
  startDate: string;
}) {
  const inRangePlaces = places.filter((place) => place.date >= startDate && place.date <= endDate);
  const selectedPlace =
    inRangePlaces.find((place) => place.id === selectedPlaceId) ?? inRangePlaces[0] ?? places[0];

  return (
    <section className="map-view" aria-labelledby="map-title">
      <div className="map-header">
        <div>
          <p className="section-label">Island map</p>
          <h2 id="map-title">Rarotonga satellite map</h2>
          <p>
            Filter by date range to see the confirmed plans and flexible ideas
            pinned around the island.
          </p>
        </div>
        <div className="date-range">
          <label>
            From
            <select
              onChange={(event) => onDateRangeChange(event.target.value, endDate)}
              value={startDate}
            >
              {data.days.map((day) => (
                <option key={day.date} value={day.date}>
                  {formatDate(day.date)}
                </option>
              ))}
            </select>
          </label>
          <label>
            To
            <select
              onChange={(event) => onDateRangeChange(startDate, event.target.value)}
              value={endDate}
            >
              {data.days.map((day) => (
                <option key={day.date} value={day.date}>
                  {formatDate(day.date)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="map-layout">
        <div className="island-map" role="img" aria-label="Satellite map of Rarotonga itinerary locations">
          <div className="map-vignette" />
          <span className="map-label north">Avarua</span>
          <span className="map-label east">Muri</span>
          <span className="map-label south">Titikaveka</span>
          <span className="map-label west">Arorangi</span>
          {inRangePlaces.map((place) => (
            <button
              aria-label={place.name}
              className={place.id === selectedPlace.id ? `map-pin active ${place.status}` : `map-pin ${place.status}`}
              key={place.id}
              onClick={() => onSelectPlace(place.id)}
              style={{ left: `${place.x}%`, top: `${place.y}%` }}
              type="button"
            >
              <span>{typeIcons[place.type]}</span>
            </button>
          ))}
          <a
            className="map-credit"
            href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
            rel="noreferrer"
            target="_blank"
          >
            Satellite imagery
          </a>
        </div>

        <div className="map-details">
          <article className="selected-place">
            <span className={`status-badge ${selectedPlace.status}`}>{statusLabels[selectedPlace.status]}</span>
            <h3>{selectedPlace.name}</h3>
            <p>{selectedPlace.note}</p>
            <dl>
              <div>
                <dt>Date</dt>
                <dd>{formatLongDate(selectedPlace.date)}</dd>
              </div>
              <div>
                <dt>Area</dt>
                <dd>{selectedPlace.area}</dd>
              </div>
              <div>
                <dt>Part of day</dt>
                <dd>{selectedPlace.period}</dd>
              </div>
            </dl>
          </article>

          <div className="place-list" aria-label="Visible map places">
            {inRangePlaces.map((place) => (
              <button
                className={place.id === selectedPlace.id ? "place-row active" : "place-row"}
                key={place.id}
                onClick={() => onSelectPlace(place.id)}
                type="button"
              >
                <span className={`status-dot ${place.status}`} />
                <span>
                  <strong>{place.name}</strong>
                  <small>{formatDate(place.date)} · {place.area}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReservationsView({ reservations }: { reservations: Reservation[] }) {
  return (
    <section className="reservations-view" aria-labelledby="reservations-title">
      <div className="reservations-header">
        <p className="section-label">Quick scan</p>
        <h2 id="reservations-title">Reservations and anchors</h2>
      </div>
      <div className="reservation-list">
        {reservations.map((reservation) => (
          <article className="reservation-row" key={`${reservation.date}-${reservation.name}`}>
            <div>
              <time>{formatDate(reservation.date)}</time>
              <strong>{reservation.name}</strong>
              <p>{reservation.notes}</p>
            </div>
            <div>
              <span className={`status-badge ${reservation.status}`}>
                {statusLabels[reservation.status]}
              </span>
              <small>{formatTime(reservation.time)}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
