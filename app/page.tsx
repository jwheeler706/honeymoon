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

const typeLabels: Record<EventType, string> = {
  travel: "Flight / travel",
  lodging: "Home base",
  activity: "Explore",
  downtime: "Chill time",
  reservation: "Food reservation",
  meal: "Food",
  excursion: "Water / excursion",
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
  label: string;
  time: string;
  title: string;
  subtitle: string;
};

type WeatherInfo = {
  temperature: number;
  label: string;
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
  lat?: number;
  lng?: number;
  offMap?: boolean;
};

type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
};

type GalleryImage = {
  id: string;
  title: string;
  date: string;
  label: string;
  image: string;
  alt: string;
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
    note: "Home base.",
    lat: -21.26645,
    lng: -159.77176,
  },
  {
    id: "punanga-nui-market",
    name: "Punanga Nui Market / Avarua",
    date: "2026-10-10",
    period: "Morning",
    status: "suggested",
    type: "activity",
    area: "Avarua",
    note: "Easy first morning option.",
    lat: -21.2052,
    lng: -159.78299,
  },
  {
    id: "nautilus",
    name: "Nautilus Resort",
    date: "2026-10-10",
    period: "Evening",
    status: "confirmed",
    type: "reservation",
    area: "Muri",
    note: "Dinner at 6:00 PM.",
    lat: -21.26129,
    lng: -159.7329,
  },
  {
    id: "tamarind",
    name: "Tamarind House main restaurant",
    date: "2026-10-11",
    period: "Evening",
    status: "confirmed",
    type: "reservation",
    area: "Avarua",
    note: "Dinner at 6:15 PM.",
    lat: -21.22734,
    lng: -159.7713,
  },
  {
    id: "black-rock",
    name: "Black Rock / west-side wandering",
    date: "2026-10-11",
    period: "Afternoon",
    status: "planned",
    type: "activity",
    area: "Northwest coast",
    note: "Scenic stop.",
    lat: -21.21,
    lng: -159.82,
  },
  {
    id: "otb",
    name: "On the Beach",
    date: "2026-10-12",
    period: "Evening",
    status: "confirmed",
    type: "reservation",
    area: "West side",
    note: "Dinner at 6:00 PM.",
    lat: -21.22471,
    lng: -159.8292,
  },
  {
    id: "turtles",
    name: "Swim With The Turtles Rarotonga",
    date: "2026-10-13",
    period: "Afternoon",
    status: "confirmed",
    type: "excursion",
    area: "Avaavaroa Passage / Takitumu",
    note: "Turtle snorkel at 2:30 PM.",
    lat: -21.26626,
    lng: -159.77952,
  },
  {
    id: "raemaru",
    name: "Raemaru Trek",
    date: "2026-10-14",
    period: "Morning",
    status: "flexible",
    type: "activity",
    area: "Arorangi",
    note: "Weather-dependent hike.",
    lat: -21.23646,
    lng: -159.81681,
  },
  {
    id: "antipodes",
    name: "Antipodes",
    date: "2026-10-15",
    period: "Evening",
    status: "confirmed",
    type: "reservation",
    area: "Northwest hills",
    note: "Dinner at 6:30 PM.",
    lat: -21.20939,
    lng: -159.82282,
  },
  {
    id: "muri-easy",
    name: "Muri casual options",
    date: "2026-10-15",
    period: "Evening",
    status: "suggested",
    type: "meal",
    area: "Muri",
    note: "Casual option.",
    lat: -21.257,
    lng: -159.733,
  },
  {
    id: "aitutaki",
    name: "Aitutaki day trip",
    date: "2026-10-16",
    period: "Afternoon",
    status: "confirmed",
    type: "excursion",
    area: "Aitutaki",
    note: "Flights 8:00 AM-8:00 PM.",
    lat: -18.8585,
    lng: -159.7789,
    offMap: true,
  },
  {
    id: "one-foot-island-lunch",
    name: "Lunch on One Foot Island",
    date: "2026-10-16",
    period: "Afternoon",
    status: "confirmed",
    type: "meal",
    area: "Tapuaetai / One Foot Island",
    note: "Lunch stop.",
    lat: -18.93741,
    lng: -159.73603,
    offMap: true,
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
  },
  {
    id: "nautilus",
    title: "Nautilus Resort",
    date: "2026-10-10",
    label: "Opening dinner",
    image:
      "https://images.squarespace-cdn.com/content/v1/68d84e7615147738b7ee4fee/66fcfb58-3e1f-4e7a-acda-558e02f3fd85/NavigateNautilusResortPolynesianRestaurantPool.webp?format=1500w",
    alt: "Nautilus Resort pool and restaurant beside Muri Lagoon.",
  },
  {
    id: "tamarind",
    title: "Tamarind House",
    date: "2026-10-11",
    label: "Dinner",
    image:
      "https://images.squarespace-cdn.com/content/v1/63d3ff8f9022444b080ead34/42664d02-a318-46ff-b33b-38e7ecf18c39/tamarind%2Brestaurant%2Brarotonga.jpg",
    alt: "Sunset dining setting at Tamarind House in Rarotonga.",
  },
  {
    id: "otb",
    title: "On the Beach Bar & Restaurant",
    date: "2026-10-12",
    label: "Beach dinner",
    image: "https://enjoycookislands.com/uploads/general/_1200x630_crop_center-center_82_none_ns/OTB-1.jpeg?mtime=1469048986",
    alt: "Beachfront dining room at On the Beach in Rarotonga.",
  },
  {
    id: "lagoon",
    title: "West-side lagoon",
    date: "2026-10-12",
    label: "Beach day",
    image:
      "https://www.downunderendeavours.com/wp-content/uploads/2018/08/SMB-cooks-650x400-rarotonga-aerial-island-view-1324.jpg",
    alt: "Rarotonga lagoon and reef from above.",
  },
  {
    id: "turtles",
    title: "Swim With The Turtles",
    date: "2026-10-13",
    label: "Snorkel",
    image:
      "https://static1.squarespace.com/static/5e6f0f42668a2e3fcf7b19a4/t/6a3fd4e916d56f3a046e56ee/1782568169078/29AugSCIphotos-13.jpg?format=1500w",
    alt: "Sea turtle underwater during a Snorkel Cook Islands excursion.",
  },
  {
    id: "aitutaki",
    title: "Aitutaki",
    date: "2026-10-16",
    label: "Day trip",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Aitutaki_aerialview.jpg",
    alt: "Aerial view of Aitutaki lagoon.",
  },
];

const rarotongaMapBounds: MapBounds = {
  west: -159.86,
  east: -159.69,
  south: -21.295,
  north: -21.165,
};

const aitutakiMapBounds: MapBounds = {
  west: -159.855,
  east: -159.715,
  south: -18.955,
  north: -18.825,
};

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

function mapPoint(place: MapPlace, bounds = rarotongaMapBounds) {
  if (place.lat === undefined || place.lng === undefined) return null;

  return {
    x: ((place.lng - bounds.west) / (bounds.east - bounds.west)) * 100,
    y: ((bounds.north - place.lat) / (bounds.north - bounds.south)) * 100,
  };
}

function dayColorClass(date: string) {
  const index = data.days.findIndex((day) => day.date === date);
  return `day-${Math.max(index, 0)}`;
}

function HomeGlyph() {
  return (
    <span className="home-glyph" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M3 12 12 4l9 8v8H3z" />
      </svg>
    </span>
  );
}

function mapPinClass(place: MapPlace, selectedPlace: MapPlace) {
  return [
    "map-pin",
    dayColorClass(place.date),
    place.id === selectedPlace.id ? "active" : "",
    place.id === "sea-change-villas" ? "home-base" : "",
  ]
    .filter(Boolean)
    .join(" ");
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

function weatherLabel(code: number) {
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Partly sunny";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Misty";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Showers";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Storms";
  return "Island weather";
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

function imageForEvent(event: TripEvent) {
  const title = event.title.toLowerCase();

  if (event.flight || event.type === "travel") return null;
  if (title.includes("sea change")) return galleryImages.find((image) => image.id === "sea-change") ?? null;
  if (title.includes("nautilus")) return galleryImages.find((image) => image.id === "nautilus") ?? null;
  if (title.includes("tamarind")) return galleryImages.find((image) => image.id === "tamarind") ?? null;
  if (title.includes("otb") || title.includes("on the beach")) {
    return galleryImages.find((image) => image.id === "otb") ?? null;
  }
  if (title.includes("west-side") || title.includes("lagoon") || title.includes("snorkel")) {
    return galleryImages.find((image) => image.id === "lagoon") ?? null;
  }
  if (title.includes("turtle")) return galleryImages.find((image) => image.id === "turtles") ?? null;
  if (title.includes("aitutaki") || title.includes("one foot")) {
    return galleryImages.find((image) => image.id === "aitutaki") ?? null;
  }

  return null;
}

function imageForReservation(reservation: Reservation) {
  const name = reservation.name.toLowerCase();

  if (name.includes("sea change")) return galleryImages.find((image) => image.id === "sea-change") ?? null;
  if (name.includes("nautilus")) return galleryImages.find((image) => image.id === "nautilus") ?? null;
  if (name.includes("tamarind")) return galleryImages.find((image) => image.id === "tamarind") ?? null;
  if (name.includes("otb") || name.includes("on the beach")) {
    return galleryImages.find((image) => image.id === "otb") ?? null;
  }
  if (name.includes("turtle")) return galleryImages.find((image) => image.id === "turtles") ?? null;
  if (name.includes("aitutaki") || name.includes("one foot")) {
    return galleryImages.find((image) => image.id === "aitutaki") ?? null;
  }

  return null;
}

function eventInlineNote(event: TripEvent) {
  if (!event.notes || event.flight) return "";

  const note = event.notes.trim();
  const normalized = note.toLowerCase();
  const isDuplicateTime = /^\d{1,2}:\d{2}\s*(am|pm)\.?$/i.test(note);
  const isGenericConfirmation = normalized === "confirmed reservation.";

  if (isDuplicateTime || isGenericConfirmation) return "";
  return note.replace(/\.$/, "");
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
      label: "CKT",
      time: formatRarotongaTime(now),
      title: countdownText(now),
      subtitle: "",
    };
  }

  const current = currentTripEvent(now);

  if (now >= tripEnd || !current) {
    return {
      key: "beach",
      label: "CKT",
      time: formatRarotongaTime(now),
      title: "Rarotonga",
      subtitle: "",
    };
  }

  return {
    key: headerKeyForEvent(current.event),
    label: "CKT",
    time: formatRarotongaTime(now),
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
      Evening: "On the Beach at 6:00.",
    },
    "2026-10-13": {
      Morning: "Easy morning at the villa.",
      Afternoon: "Turtle snorkel is the main moment.",
      Evening: "Chill night after the water.",
    },
    "2026-10-14": {
      Morning: "Weather decides.",
      Afternoon: "Adventure window if it feels right.",
      Evening: "Open night.",
    },
    "2026-10-15": {
      Morning: "Slow honeymoon morning.",
      Afternoon: "Beach, lagoon, villa, or a flexible hike.",
      Evening: "Antipodes at 6:30.",
    },
    "2026-10-16": {
      Morning: "Aitutaki day.",
      Afternoon: "Aitutaki day.",
      Evening: "Easy dinner.",
    },
    "2026-10-17": {
      Morning: "Final slow morning and packing.",
      Afternoon: "Keep departure logistics easy.",
    },
  };

  return tones[day.date]?.[period] ?? "Open.";
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
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      } else {
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => registrations.forEach((registration) => registration.unregister()))
          .catch(() => undefined);
      }
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

  useEffect(() => {
    let ignore = false;

    async function loadWeather() {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-21.23&longitude=-159.78&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=Pacific%2FRarotonga",
        );
        if (!response.ok) return;
        const weatherData = (await response.json()) as {
          current?: {
            temperature_2m?: number;
            weather_code?: number;
          };
        };
        const temperature = weatherData.current?.temperature_2m;
        const code = weatherData.current?.weather_code;
        if (!ignore && typeof temperature === "number" && typeof code === "number") {
          setWeather({
            temperature: Math.round(temperature),
            label: weatherLabel(code),
          });
        }
      } catch {
        // Weather is nice-to-have; keep the header calm if it is unavailable.
      }
    }

    loadWeather();
    const timer = window.setInterval(loadWeather, 30 * 60_000);
    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);

  const activeDay = data.days.find((day) => day.date === state.activeDay) ?? data.days[0];

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
          <p className="header-meta">
            <span>{header.label}</span>
            <span>{header.time}</span>
            {weather ? <span>{weather.temperature}° {weather.label}</span> : null}
          </p>
          <h1 id="trip-title">{header.title}</h1>
          {header.subtitle ? <span>{header.subtitle}</span> : null}
        </div>
      </section>

      <section className="day-picker" aria-label="Choose itinerary day">
        <label>
          <span className="sr-only">Day</span>
          <select
            onChange={(event) => updateState({ activeDay: event.target.value, view: "plan" })}
            value={activeDay.date}
          >
            {data.days.map((day) => (
              <option key={day.date} value={day.date}>
                {day.weekday} · {formatDate(day.date)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="control-row" aria-label="App views">
        {(["plan", "reservations", "map", "gallery"] as const).map((view) => (
          <button
            className={state.view === view ? "view-tab active" : "view-tab"}
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
              {activeDay.status === "confirmed" ? null : (
                <div className="day-meta">
                  <span className={`status-badge ${activeDay.status}`}>{statusLabels[activeDay.status]}</span>
                </div>
              )}
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
                          const eventImage = imageForEvent(event);
                          const inlineNote = eventInlineNote(event);
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
                                    {event.status === "confirmed" ? null : (
                                      <span className={`status-badge ${event.status}`}>
                                        {statusLabels[event.status]}
                                      </span>
                                    )}
                                  </div>
                                  <h4>
                                    {event.title}
                                    {inlineNote ? <span> · {inlineNote}</span> : null}
                                  </h4>
                                  {event.flight ? <p>{event.notes}</p> : null}
                                  {eventImage ? (
                                    <img
                                      alt={eventImage.alt}
                                      className="event-photo"
                                      loading="lazy"
                                      src={eventImage.image}
                                    />
                                  ) : null}
                                  {event.flight ? <FlightDetails event={event} /> : null}
                                </div>
                              </div>

                              <details className={`event-note ${state.notes[key] ? "has-note" : ""}`}>
                                <summary aria-label={`Trip note for ${event.title}`}>
                                  <span aria-hidden="true" className="note-glyph" />
                                  <span className="sr-only">Trip note</span>
                                </summary>
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
        <h2 id="gallery-title">Trip images</h2>
      </div>
      <div className="gallery-grid">
        {images.map((image) => (
          <article className="gallery-card" key={image.id}>
            <img alt={image.alt} loading="lazy" src={image.image} />
            <div>
              <span>{formatDate(image.date)} · {image.label}</span>
              <h3>{image.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
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
      Afternoon: ["Villa recovery", "Short island drive", "Easy reset"],
      Evening: ["Sunset drink", "Simple dinner", "Quiet villa night"],
    },
    "2026-10-15": {
      Morning: ["Slow villa morning", "Lagoon float", "Raemaru if not done"],
      Afternoon: ["Protected downtime", "Muri wander", "Beach nap"],
      Evening: ["Antipodes", "Sunset timing", "Easy ride back"],
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
      <p>Maybe {items.join(" or ").toLowerCase()}.</p>
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
  const isAitutakiOnly = startDate === "2026-10-16" && endDate === "2026-10-16";
  const activeMapBounds = isAitutakiOnly ? aitutakiMapBounds : rarotongaMapBounds;
  const inRangePlaces = places.filter((place) => place.date >= startDate && place.date <= endDate);
  const homeBase = places.find((place) => place.id === "sea-change-villas");
  const mappablePlaces = inRangePlaces.filter((place) =>
    isAitutakiOnly
      ? place.offMap && mapPoint(place, activeMapBounds)
      : !place.offMap && mapPoint(place, activeMapBounds)
  );
  const visibleMappablePlaces =
    !isAitutakiOnly && homeBase && !mappablePlaces.some((place) => place.id === homeBase.id)
      ? [homeBase, ...mappablePlaces]
      : mappablePlaces;
  const visiblePlaces =
    !isAitutakiOnly && homeBase && !inRangePlaces.some((place) => place.id === homeBase.id)
      ? [homeBase, ...inRangePlaces]
      : inRangePlaces;
  const offMapPlaces = isAitutakiOnly ? [] : inRangePlaces.filter((place) => place.offMap);
  const selectedPlace =
    visiblePlaces.find((place) => place.id === selectedPlaceId) ?? visiblePlaces[0] ?? places[0];
  const selectedMapPoint = visibleMappablePlaces.some((place) => place.id === selectedPlace.id)
    ? mapPoint(selectedPlace, activeMapBounds)
    : null;
  const popupClass = selectedMapPoint
    ? [
        "map-popup",
        selectedMapPoint.x > 68 ? "left" : "",
        selectedMapPoint.y > 62 ? "above" : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <section className="map-view" aria-labelledby="map-title">
      <div className="map-header">
        <div>
          <p className="section-label" id="map-title">{isAitutakiOnly ? "Aitutaki map" : "Island map"}</p>
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
        <div
          className={isAitutakiOnly ? "island-map aitutaki-map" : "island-map"}
          role="img"
          aria-label={isAitutakiOnly ? "Satellite map of Aitutaki lagoon" : "Satellite map of Rarotonga itinerary locations"}
        >
          {isAitutakiOnly ? (
            <>
              <span className="map-label ait-main">Aitutaki</span>
              <span className="map-label ait-lagoon">Lagoon</span>
              <span className="map-label ait-arutanga">Arutanga</span>
            </>
          ) : (
            <>
              <span className="map-label north">Avarua</span>
              <span className="map-label east">Muri</span>
              <span className="map-label south">Titikaveka</span>
              <span className="map-label west">Arorangi</span>
            </>
          )}
          {visibleMappablePlaces.map((place) => {
            const point = mapPoint(place, activeMapBounds);
            if (!point) return null;

            return (
              <button
                aria-label={place.name}
                className={mapPinClass(place, selectedPlace)}
                key={place.id}
                onClick={() => onSelectPlace(place.id)}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                title={`${formatDate(place.date)} · ${place.name}`}
                type="button"
              >
                {place.id === "sea-change-villas" ? <HomeGlyph /> : null}
              </button>
            );
          })}
          {selectedMapPoint ? (
            <article
              className={popupClass}
              style={{ left: `${selectedMapPoint.x}%`, top: `${selectedMapPoint.y}%` }}
            >
              <strong>{selectedPlace.name}</strong>
              <span>{formatDate(selectedPlace.date)} · {selectedPlace.area}</span>
              <p>{selectedPlace.note}</p>
            </article>
          ) : null}
          <div className="map-legend" aria-label="Map pin key">
            {data.days
              .filter((day) => day.date >= startDate && day.date <= endDate)
              .map((day) => (
                <span className={dayColorClass(day.date)} key={day.date}>
                  <i />
                  {formatDate(day.date)}
                </span>
              ))}
          </div>
        </div>

        {offMapPlaces.length ? (
          <div className="off-map-list" aria-label="Off-map trip items">
            {offMapPlaces.map((place) => (
              <button
                className={place.id === selectedPlace.id ? `off-map-pill active ${dayColorClass(place.date)}` : `off-map-pill ${dayColorClass(place.date)}`}
                key={place.id}
                onClick={() => onSelectPlace(place.id)}
                type="button"
              >
                {formatDate(place.date)} · {place.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="map-details">
          <article
            className={selectedPlace.id === "sea-change-villas" ? "selected-place home-base-detail" : "selected-place"}
          >
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
              <div>
                <dt>Type</dt>
                <dd>{typeLabels[selectedPlace.type]}</dd>
              </div>
            </dl>
          </article>

          <div className="place-list" aria-label="Visible map places">
            {visiblePlaces.map((place) => (
              <button
                className={
                  place.id === selectedPlace.id
                    ? `place-row active ${dayColorClass(place.date)}`
                    : `place-row ${dayColorClass(place.date)}`
                }
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
  const groups = reservations.reduce<Array<{ date: string; items: Reservation[] }>>((accumulator, reservation) => {
    const current = accumulator[accumulator.length - 1];
    if (current?.date === reservation.date) {
      current.items.push(reservation);
    } else {
      accumulator.push({ date: reservation.date, items: [reservation] });
    }
    return accumulator;
  }, []);

  return (
    <section className="reservations-view" aria-labelledby="reservations-title">
      <h2 className="sr-only" id="reservations-title">Saved plans</h2>
      <div className="reservation-list">
        {groups.map((group) => (
          <section className="reservation-day" key={group.date} aria-label={formatLongDate(group.date)}>
            <h3>{formatLongDate(group.date)}</h3>
            {group.items.map((reservation) => {
              const when = reservation.time ? formatTime(reservation.time) : "Time TBD";
              const reservationImage = imageForReservation(reservation);
              return (
                <article
                  className={`reservation-row ${reservationImage ? "has-photo" : ""} ${dayColorClass(reservation.date)}`}
                  key={`${reservation.date}-${reservation.name}`}
                >
                  {reservationImage ? (
                    <img
                      alt={reservationImage.alt}
                      className="reservation-photo"
                      loading="lazy"
                      src={reservationImage.image}
                    />
                  ) : null}
                  <div className="reservation-copy">
                    <div className="reservation-main">
                      <time>{when}</time>
                      <span className={`status-dot ${reservation.status}`} aria-label={statusLabels[reservation.status]} />
                    </div>
                    <strong>{reservation.name}</strong>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </section>
  );
}
