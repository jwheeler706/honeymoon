"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
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

type CalendarItem = TripEvent & {
  day: Day;
  period: Period;
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
  selectedPlace: "",
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
  planned: "Flexible",
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
  mood: "clear" | "cloud" | "rain";
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
  position?: string;
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
    id: "rarotonga-airport-arrival",
    name: "Rarotonga Airport",
    date: "2026-10-09",
    period: "Evening",
    status: "confirmed",
    type: "travel",
    area: "Avarua / Nikao",
    note: "Arrive on AS 895 at 10:50 PM.",
    lat: -21.2027,
    lng: -159.806,
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
    area: "Tupapa / Avarua",
    note: "Dinner at 6:15 PM.",
    lat: -21.20432,
    lng: -159.762705,
  },
  {
    id: "black-rock",
    name: "Black Rock / west-side wandering",
    date: "2026-10-11",
    period: "Afternoon",
    status: "flexible",
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
    id: "rarotonga-airport-car-pickup",
    name: "Rarotonga Airport",
    date: "2026-10-13",
    period: "Morning",
    status: "confirmed",
    type: "travel",
    area: "Avarua / Nikao",
    note: "Pick up the rental car at 9:00 AM.",
    lat: -21.2027,
    lng: -159.806,
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
    id: "aitutaki-airport",
    name: "Aitutaki Airport",
    date: "2026-10-16",
    period: "Morning",
    status: "confirmed",
    type: "travel",
    area: "Aitutaki",
    note: "Air Rarotonga flights arrive at 8:50 AM and depart at 7:10 PM.",
    lat: -18.82953,
    lng: -159.766715,
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
  {
    id: "blue-lagoon-restaurant",
    name: "Blue Lagoon Restaurant",
    date: "2026-10-16",
    period: "Evening",
    status: "confirmed",
    type: "meal",
    area: "Ootu Point",
    note: "Dinner around 5:00 PM.",
    lat: -18.848215,
    lng: -159.760167,
    offMap: true,
  },
  {
    id: "rarotonga-airport-departure",
    name: "Rarotonga Airport",
    date: "2026-10-17",
    period: "Afternoon",
    status: "confirmed",
    type: "travel",
    area: "Avarua / Nikao",
    note: "Return the rental car at 11:00 AM, then depart on AS 896 at 12:05 PM.",
    lat: -21.2027,
    lng: -159.806,
  },
];

const galleryImages: GalleryImage[] = [
  {
    id: "sea-change",
    title: "Sea Change Villas",
    date: "2026-10-09",
    label: "Home base",
    image: "/images/sea-change.webp",
    alt: "Lagoon View Villa at Sea Change Villas in Rarotonga.",
  },
  {
    id: "nautilus",
    title: "Nautilus Resort",
    date: "2026-10-10",
    label: "Dinner",
    image: "/images/nautilus.webp",
    alt: "Nautilus Resort pool and restaurant beside Muri Lagoon.",
  },
  {
    id: "tamarind",
    title: "Tamarind House",
    date: "2026-10-11",
    label: "Dinner",
    image: "/images/tamarind.webp",
    alt: "Sunset dining setting at Tamarind House in Rarotonga.",
  },
  {
    id: "otb",
    title: "On the Beach Bar & Restaurant",
    date: "2026-10-12",
    label: "Beach dinner",
    image: "/images/otb.jpg",
    alt: "Beachfront dining room at On the Beach in Rarotonga.",
  },
  {
    id: "lagoon",
    title: "West-side lagoon",
    date: "2026-10-12",
    label: "Beach day",
    image: "/images/rarotonga-aerial.jpg",
    alt: "Rarotonga lagoon and reef from above.",
  },
  {
    id: "muri-beach",
    title: "Muri Beach",
    date: "2026-10-12",
    label: "Lagoon",
    image: "/images/muri-beach.jpg",
    alt: "Muri Beach with calm lagoon water and island scenery.",
  },
  {
    id: "muri-islets",
    title: "Muri lagoon islets",
    date: "2026-10-12",
    label: "Lagoon",
    image: "/images/muri-islets.jpg",
    alt: "Muri Lagoon and islets from above.",
  },
  {
    id: "rarotonga-peaks",
    title: "Rarotonga peaks",
    date: "2026-10-14",
    label: "Nature",
    image: "/images/rarotonga-peaks.jpg",
    alt: "Green volcanic peaks and rainforest in Rarotonga.",
  },
  {
    id: "lagoon-swim",
    title: "Lagoon swim",
    date: "2026-10-15",
    label: "Lagoon",
    image: "/images/lagoon-swim.jpg",
    alt: "Clear Rarotonga lagoon water with palms and mountains beyond.",
  },
  {
    id: "palm-beach",
    title: "South-coast beach",
    date: "2026-10-15",
    label: "Beach",
    image: "/images/south-coast-beach.jpg",
    alt: "Palm-lined beach and turquoise water on Rarotonga's south coast.",
  },
  {
    id: "turtles",
    title: "Swim With The Turtles",
    date: "2026-10-13",
    label: "Snorkel",
    image: "/images/turtles.webp",
    alt: "Sea turtle underwater during a Snorkel Cook Islands excursion.",
  },
  {
    id: "aitutaki",
    title: "Aitutaki",
    date: "2026-10-16",
    label: "Day trip",
    image: "/images/map-aitutaki.jpg",
    alt: "Satellite view of Aitutaki lagoon and reef.",
    position: "center",
  },
  {
    id: "one-foot",
    title: "One Foot Island",
    date: "2026-10-16",
    label: "Lunch stop",
    image: "/images/one-foot.jpg",
    alt: "One Foot Island and the surrounding Aitutaki lagoon.",
  },
  {
    id: "blue-lagoon",
    title: "Blue Lagoon Restaurant",
    date: "2026-10-16",
    label: "Dinner",
    image: "/images/blue-lagoon.jpg",
    alt: "Dinner at Blue Lagoon Restaurant with Ootu Beach beyond.",
    position: "center",
  },
];

const scenicHeaderImages = [
  {
    title: "Rarotonga",
    image: "/images/rarotonga-aerial.jpg",
    position: "center 54%",
  },
  {
    title: "Muri lagoon",
    image: "/images/muri-islets.jpg",
    position: "center 52%",
  },
  {
    title: "Rarotonga peaks",
    image: "/images/rarotonga-peaks.jpg",
    position: "center 45%",
  },
  {
    title: "Lagoon swim",
    image: "/images/lagoon-swim.jpg",
    position: "center 52%",
  },
  {
    title: "South-coast beach",
    image: "/images/south-coast-beach.jpg",
    position: "center 48%",
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

function hourlyScenicIndex() {
  return Math.floor(Date.now() / 3_600_000) % scenicHeaderImages.length;
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

function mapColorClass(place: MapPlace) {
  const combined = `${place.name} ${place.note} ${place.area}`.toLowerCase();
  if (place.id === "sea-change-villas" || place.type === "lodging") return "type-home";
  if (place.type === "meal" || place.type === "reservation") return "type-food";
  if (place.type === "travel") return "type-travel";
  if (
    place.type === "excursion" ||
    combined.includes("turtle") ||
    combined.includes("snorkel") ||
    combined.includes("lagoon") ||
    combined.includes("beach")
  ) {
    return "type-water";
  }
  return "type-land";
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

function MapGlyph() {
  return (
    <span className="map-glyph" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M4.5 5.5h15v3l-1.5 1.2 1.5 1.3v7.5h-15v-3l1.4-1.2-1.4-1.3z" />
        <path d="M9.5 5.5v13" />
        <path d="M14.5 5.5v13" />
        <path d="m6.8 8.1 1.4-.8" />
        <path d="m16.2 15.9 1.4-.8" />
      </svg>
    </span>
  );
}

function mapPinClass(place: MapPlace, selectedPlaceId: string) {
  return [
    "map-pin",
    mapColorClass(place),
    place.id === selectedPlaceId ? "active" : "",
    place.id === "sea-change-villas" ? "home-base" : "",
  ]
    .filter(Boolean)
    .join(" ");
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

function weatherMood(code: number): WeatherInfo["mood"] {
  if ([0, 1, 2].includes(code)) return "clear";
  if ([3, 45, 48].includes(code)) return "cloud";
  return "rain";
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
  if (title.includes("blue lagoon")) return galleryImages.find((image) => image.id === "blue-lagoon") ?? null;
  if (title.includes("one foot") || title.includes("tapuaetai")) {
    return galleryImages.find((image) => image.id === "one-foot") ?? null;
  }
  if (title.includes("west-side") || title.includes("lagoon") || title.includes("snorkel")) {
    return galleryImages.find((image) => image.id === "lagoon") ?? null;
  }
  if (title.includes("turtle")) return galleryImages.find((image) => image.id === "turtles") ?? null;
  if (title.includes("aitutaki")) {
    return galleryImages.find((image) => image.id === "aitutaki") ?? null;
  }

  return null;
}

function imageForPlace(place: MapPlace) {
  const eventLike: TripEvent = {
    notes: place.note,
    status: place.status,
    time: null,
    title: place.name,
    type: place.type,
  };

  return imageForEvent(eventLike);
}

function normalizedMatch(value: string) {
  return value.toLowerCase();
}

function airportMapPlaceForEvent(event: TripEvent, day?: Day) {
  const title = normalizedMatch(event.title);
  const note = normalizedMatch(event.notes);
  const route = event.flight ? normalizedMatch(event.flight.route) : "";
  const combined = `${title} ${note} ${route}`;

  if (!combined.includes("rar") && !combined.includes("rarotonga airport")) return null;
  if (day?.date === "2026-10-09") return "rarotonga-airport-arrival";
  if (day?.date === "2026-10-13") return "rarotonga-airport-car-pickup";
  if (day?.date === "2026-10-16" && (combined.includes("ait") || combined.includes("aitutaki"))) {
    return "aitutaki-airport";
  }
  if (day?.date === "2026-10-17") return "rarotonga-airport-departure";
  return null;
}

function mapPlaceForEvent(event: TripEvent, day?: Day) {
  if (event.flight || event.type === "travel") return airportMapPlaceForEvent(event, day);
  const title = normalizedMatch(event.title);
  const note = normalizedMatch(event.notes);
  const combined = `${title} ${note}`;

  if (combined.includes("sea change")) return "sea-change-villas";
  if (combined.includes("punanga")) return "punanga-nui-market";
  if (combined.includes("nautilus")) return "nautilus";
  if (combined.includes("tamarind")) return "tamarind";
  if (combined.includes("black rock") || combined.includes("arorangi") || combined.includes("north and west")) {
    return "black-rock";
  }
  if (combined.includes("on the beach")) return "otb";
  if (combined.includes("turtle")) return "turtles";
  if (combined.includes("raemaru") || combined.includes("hike")) return "raemaru";
  if (combined.includes("antipodes")) return "antipodes";
  if (combined.includes("one foot") || combined.includes("tapuaetai")) return "one-foot-island-lunch";
  if (combined.includes("blue lagoon")) return "blue-lagoon-restaurant";
  if (combined.includes("aitutaki")) return "aitutaki";

  return null;
}

function eventInlineNote(event: TripEvent) {
  if (event.flight) return "";
  return "";
}

function eventDetailNote(event: TripEvent) {
  if (event.flight || event.type === "travel") return "";
  if (/^(confirmed reservation|confirmed plan|keep it easy)\.?$/i.test(event.notes)) return "";
  const normalizedNote = event.notes.trim().replace(/[.!]$/, "").toLowerCase();
  const normalizedTime = formatTime(event.time).trim().toLowerCase();
  if (normalizedNote === normalizedTime) return "";
  return event.notes;
}

function compactMapDate(place: MapPlace) {
  return `${place.period} ${formatDate(place.date)}`;
}

function eventMetaTime(event: TripEvent, period: Period) {
  if (event.flight) return "";

  const formatted = formatTime(event.time);
  const normalized = formatted.trim().toLowerCase();
  const periodLabel = period.toLowerCase();
  const broadSlots = new Set(["morning", "afternoon", "daytime", "evening"]);
  return normalized === periodLabel || broadSlots.has(normalized) ? "" : formatted;
}

function eventMetaStatus(event: TripEvent) {
  return event.status === "flexible" ? statusLabels[event.status] : "";
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
  const tripEndDate = new Date(`${data.trip.endDate}T00:00:00-10:00`);
  const tripEnd = new Date(tripEndDate.getTime() + 86_400_000);

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
    "2026-10-08": {
      Morning: "Keep the day simple.",
      Afternoon: "Pack, reset, and head to the airport.",
      Evening: "Flights to Los Angeles.",
    },
    "2026-10-09": {
      Evening: "Arrive, exhale, and keep the night simple.",
    },
    "2026-10-10": {
      Morning: "Ease into the island if you are feeling fresh.",
      Afternoon: "Leave room for villa time before dinner.",
      Evening: "First proper honeymoon dinner.",
    },
    "2026-10-11": {
      Morning: "Easy start before the island loop.",
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
      Evening: "Blue Lagoon after the tour.",
    },
    "2026-10-17": {
      Morning: "Final slow morning and packing.",
      Afternoon: "Keep departure logistics easy.",
    },
    "2026-10-18": {
      Morning: "Flights home.",
      Afternoon: "One last connection.",
      Evening: "Back home.",
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
  const [scenicIndex, setScenicIndex] = useState(() => hourlyScenicIndex());
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
    const timer = window.setInterval(() => {
      setScenicIndex(hourlyScenicIndex());
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
            mood: weatherMood(code),
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
  const scenicHeader = header.key === "countdown" || header.key === "beach" || header.key === "flight";
  const scenicImage = scenicHeaderImages[scenicIndex % scenicHeaderImages.length];
  const activeHeaderEvent = currentTripEvent()?.event;
  const activityHeaderImage = activeHeaderEvent ? imageForEvent(activeHeaderEvent) : null;
  const headerImage = scenicHeader ? scenicImage : activityHeaderImage;
  const headerStyle: CSSProperties | undefined = headerImage
    ? {
        "--header-image": `url("${headerImage.image}")`,
        backgroundPosition: headerImage.position ?? "center",
      } as CSSProperties
    : undefined;

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

  function showEventOnMap(day: Day, placeId: string) {
    updateState({
      activeDay: day.date,
      mapStart: day.date,
      mapEnd: day.date,
      selectedPlace: placeId,
      view: "map",
    });
  }

  return (
    <main className={`app-shell theme-${timeTheme} weather-${weather?.mood ?? "neutral"}`}>
      <section className={`top-panel header-${header.key}`} style={headerStyle} aria-labelledby="trip-title">
        <div className="title-block">
          <p className="header-meta">
            <span>{header.time} {header.label}</span>
            {weather ? (
              <>
                <span>{weather.temperature}°</span>
                <span>{weather.label}</span>
              </>
            ) : null}
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
                ? "Itinerary"
                : view === "map"
                  ? "Map"
                  : "Gallery"}
          </button>
        ))}
      </section>

      {state.view === "reservations" ? (
        <CalendarView
          days={data.days}
          onSelectDay={(activeDay) => updateState({ activeDay, view: "plan" })}
        />
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
                const skipOpenPeriod =
                  !events.length &&
                  (activeDay.theme.includes("travel") ||
                    activeDay.events.every((event) => event.flight || event.type === "travel"));
                const openPeriodCopy = [periodTone(activeDay, period), recommendationText(activeDay, period)]
                  .filter(Boolean)
                  .join(" ");
                if (skipOpenPeriod) return null;

                return (
                  <section className="period-section" key={period} aria-label={period}>
                    <div className="period-heading">
                      <h3>{period}</h3>
                      {events.length ? null : <p>{openPeriodCopy}</p>}
                    </div>

                    {events.length ? (
                      <div className="timeline">
                        {events.map((event) => {
                          const key = eventKey(activeDay, event);
                          const eventImage = imageForEvent(event);
                          const inlineNote = eventInlineNote(event);
                          const detailNote = eventDetailNote(event);
                          const eventMapPlace = mapPlaceForEvent(event, activeDay);
                          const titleClass =
                            event.flight || event.type === "travel" ? "event-title" : "event-title event-title-accent";
                          const metaTime = eventMetaTime(event, period);
                          const metaStatus = eventMetaStatus(event);
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
                                  <h4 className={titleClass}>
                                    {event.title}
                                    {inlineNote ? <span> - {inlineNote}</span> : null}
                                  </h4>
                                  {metaTime || metaStatus ? (
                                    <div className="event-topline">
                                      {metaTime ? <time>{metaTime}</time> : null}
                                      {metaStatus ? (
                                        <span className={`status-badge ${event.status}`}>{metaStatus}</span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {detailNote ? <p className="event-detail-note">{detailNote}</p> : null}
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

                              {eventMapPlace ? (
                                <button
                                  aria-label={`Show ${event.title} on map`}
                                  className="event-map-link"
                                  onClick={() => showEventOnMap(activeDay, eventMapPlace)}
                                  type="button"
                                >
                                  <MapGlyph />
                                </button>
                              ) : null}

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
  const scenicOrder = new Map(
    ["lagoon", "muri-beach", "muri-islets", "rarotonga-peaks", "lagoon-swim", "palm-beach"].map((id, index) => [
      id,
      index,
    ]),
  );
  const orderedImages = images.filter((image) => !scenicOrder.has(image.id)).sort((a, b) => {
    const aOrder = scenicOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = scenicOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  return (
    <section className="gallery-view" aria-label="Gallery">
      <div className="header-scene-strip" aria-label="Island scenes">
        {scenicHeaderImages.map((image) => (
          <article key={image.title}>
            <img
              alt={`${image.title}.`}
              loading="lazy"
              src={image.image}
              style={{ objectPosition: image.position }}
            />
            <span>{image.title}</span>
          </article>
        ))}
      </div>
      <div className="gallery-grid">
        {orderedImages.map((image) => (
          <article className="gallery-card" key={image.id}>
            <img
              alt={image.alt}
              loading="lazy"
              src={image.image}
              style={image.position ? { objectPosition: image.position } : undefined}
            />
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

function recommendationText(day: Day, period: Period) {
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
  if (!items.length) return "";

  return `Maybe ${items.join(" or ").toLowerCase()}.`;
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
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const firstTripDate = data.days[0]?.date ?? startDate;
  const lastTripDate = data.days[data.days.length - 1]?.date ?? endDate;
  const isAitutakiOnly = startDate === "2026-10-16" && endDate === "2026-10-16";
  const allDatesSelected = startDate === firstTripDate && endDate === lastTripDate;
  const activeMapBounds = isAitutakiOnly ? aitutakiMapBounds : rarotongaMapBounds;
  const seaChangeDate = "2026-10-09";
  const seaChangeSelected = startDate === seaChangeDate && endDate === seaChangeDate;
  const inRangePlaces = places.filter((place) => place.date >= startDate && place.date <= endDate);
  const homeBase = places.find((place) => place.id === "sea-change-villas");
  const visibleRangePlaces = inRangePlaces.filter((place) => place.id !== "sea-change-villas" || seaChangeSelected);
  const mappablePlaces = inRangePlaces.filter((place) =>
    place.id !== "sea-change-villas" || seaChangeSelected
  ).filter((place) =>
    isAitutakiOnly ? place.offMap && mapPoint(place, activeMapBounds) : !place.offMap && mapPoint(place, activeMapBounds)
  );
  const visibleMappablePlaces =
    !isAitutakiOnly && homeBase && !mappablePlaces.some((place) => place.id === homeBase.id)
      ? [homeBase, ...mappablePlaces]
      : mappablePlaces;
  const visiblePlaces = isAitutakiOnly
    ? visibleRangePlaces
    : visibleRangePlaces.filter((place) => !place.offMap);
  const selectedMapPlace = selectedPlaceId
    ? visibleMappablePlaces.find((place) => place.id === selectedPlaceId)
    : null;
  const selectedMapPoint = selectedMapPlace ? mapPoint(selectedMapPlace, activeMapBounds) : null;
  const selectedMapImage = selectedMapPlace ? imageForPlace(selectedMapPlace) : null;
  const popupHasImage = Boolean(selectedMapImage);
  const textOnlyPopupStyle: CSSProperties | undefined = popupHasImage
    ? undefined
    : { gridTemplateColumns: "minmax(0, 1fr)", minHeight: 0 };
  const textOnlyPopupTextStyle: CSSProperties | undefined = popupHasImage ? undefined : { gridColumn: 1 };
  const popupClass = selectedMapPoint
    ? [
        "map-popup",
        popupHasImage ? "has-image" : "text-only",
        selectedMapPoint.x > 54 ? "left" : "",
        selectedMapPoint.y > 54 ? "above" : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";
  const showAllDates = () => {
    onDateRangeChange(firstTripDate, lastTripDate);
    onSelectPlace("");
  };
  const showSingleDate = (date: string) => {
    if (startDate === date && endDate === date) {
      showAllDates();
      return;
    }
    onDateRangeChange(date, date);
    onSelectPlace("");
  };

  useEffect(() => {
    if (!selectedPlaceId) return undefined;

    const dismissWhenOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (mapShellRef.current?.contains(target) && target.closest(".map-pin, .map-popup")) return;
      onSelectPlace("");
    };

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSelectPlace("");
    };

    document.addEventListener("pointerdown", dismissWhenOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissWhenOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [onSelectPlace, selectedPlaceId]);

  return (
    <section className="map-view" aria-labelledby="map-title">
      <div className="map-header">
        <div>
          <p className="section-label" id="map-title">{isAitutakiOnly ? "Aitutaki map" : "Island map"}</p>
        </div>
      </div>

      <div className="map-layout">
        <div ref={mapShellRef} style={{ maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
          <div className="map-visual-frame" style={{ display: "grid", gap: 6, maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
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
                    className={mapPinClass(place, selectedPlaceId)}
                    key={place.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectPlace(place.id === selectedPlaceId ? "" : place.id);
                    }}
                    style={{
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      zIndex: place.id === selectedPlaceId ? 9 : undefined,
                    }}
                    title={place.id === "sea-change-villas" ? place.name : `${compactMapDate(place)} · ${place.name}`}
                    type="button"
                  >
                    {place.id === "sea-change-villas" ? <HomeGlyph /> : null}
                  </button>
                );
              })}
              {selectedMapPoint && selectedMapPlace ? (
                <article
                  className={popupClass}
                  onPointerDown={(event) => event.stopPropagation()}
                  style={{
                    ...textOnlyPopupStyle,
                    left: `${selectedMapPoint.x}%`,
                    pointerEvents: "auto",
                    top: `${selectedMapPoint.y}%`,
                  }}
                >
                  {selectedMapImage ? (
                    <img alt={selectedMapImage.alt} loading="lazy" src={selectedMapImage.image} />
                  ) : null}
                  <strong style={textOnlyPopupTextStyle}>{selectedMapPlace.name}</strong>
                  <span style={textOnlyPopupTextStyle}>
                    {selectedMapPlace.id === "sea-change-villas"
                      ? selectedMapPlace.area
                      : `${compactMapDate(selectedMapPlace)} · ${selectedMapPlace.area}`}
                  </span>
                  <p style={textOnlyPopupTextStyle}>{selectedMapPlace.note}</p>
                </article>
              ) : null}
            </div>

            <div className="map-legend-footer">
              <div className="map-color-legend" aria-label="Pin color key">
                <span><i className="type-water" />Water</span>
                <span><i className="type-land" />Land</span>
                <span><i className="type-food" />Food</span>
                <span><i className="type-travel" />Travel</span>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: "100%", minWidth: 0, overflow: "hidden" }}>
            <div className="map-date-toggles" aria-label="Map date filters" style={{ minWidth: 0 }}>
              <button
                aria-pressed={allDatesSelected}
                className={allDatesSelected ? "active" : ""}
                onClick={showAllDates}
                type="button"
              >
                All
              </button>
              {data.days.map((day) => {
                const selected = !allDatesSelected && startDate === day.date && endDate === day.date;
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? "active" : ""}
                    key={day.date}
                    onClick={() => showSingleDate(day.date)}
                    type="button"
                  >
                    {formatDate(day.date)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="map-details">
          <div className="place-list" aria-label="Visible map places">
            {visiblePlaces.map((place) => (
              <div
                className={`place-row ${mapColorClass(place)}`}
                key={place.id}
              >
                <span className="status-dot" />
                <span>
                  <strong>{place.name}</strong>
                  <small>
                    {place.id === "sea-change-villas"
                      ? place.area
                      : allDatesSelected
                        ? `${compactMapDate(place)} · ${place.area}`
                        : `${place.period} · ${place.area}`}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function calendarItemsForDay(day: Day): CalendarItem[] {
  return day.events
    .map((event) => ({
      ...event,
      day,
      period: eventPeriod(event),
    }))
    .sort((a, b) => eventStartMinutes(a) - eventStartMinutes(b));
}

function calendarItemClass(item: CalendarItem) {
  return [
    "calendar-item",
    `calendar-${item.status}`,
    item.flight || item.type === "travel" ? "calendar-travel" : "",
    item.type === "reservation" || item.type === "meal" ? "calendar-food" : "",
    item.type === "excursion" || item.type === "activity" ? "calendar-activity" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function calendarItemText(item: CalendarItem) {
  if (item.flight) return item.flight.route;
  if (item.status === "flexible" || item.status === "suggested") return statusLabels[item.status];
  if (item.status === "planned" || item.type === "travel") return "";
  return item.type === "meal" || item.type === "reservation" ? "" : typeLabels[item.type];
}

function CalendarView({
  days,
  onSelectDay,
}: {
  days: Day[];
  onSelectDay: (day: string) => void;
}) {
  return (
    <section className="calendar-view" aria-labelledby="calendar-title">
      <div className="calendar-header">
        <h2 id="calendar-title">Oct 8-18</h2>
      </div>

      <div className="calendar-board">
        {days.map((day) => {
          const dayItems = calendarItemsForDay(day);
          const travelOnlyDay = day.events.every((event) => event.flight || event.type === "travel");
          return (
            <article className={`calendar-day ${dayColorClass(day.date)}`} key={day.date}>
              <button
                className="calendar-day-head"
                onClick={() => onSelectDay(day.date)}
                type="button"
              >
                <span>
                  <strong>{day.weekday}</strong>
                  <small>{formatDate(day.date)}</small>
                </span>
                <b>{day.title}</b>
              </button>

              <div className="calendar-lanes">
                {periodLabels.map((period) => {
                  const items = dayItems.filter((item) => item.period === period);
                  if (!items.length && travelOnlyDay) return null;
                  return (
                    <div className="calendar-lane" key={period}>
                      <span>{period}</span>
                      <div className="calendar-lane-items">
                        {items.length ? (
                          items.map((item) => (
                            <button
                            className={calendarItemClass(item)}
                            key={`${day.date}-${item.title}`}
                            onClick={() => onSelectDay(day.date)}
                            type="button"
                          >
                            {(() => {
                              const itemText = calendarItemText(item);
                              return (
                                <>
                                  {eventMetaTime(item, item.period) ? (
                                    <time>{eventMetaTime(item, item.period)}</time>
                                  ) : null}
                                  <strong>{item.title}</strong>
                                  {itemText ? <small>{itemText}</small> : null}
                                </>
                              );
                            })()}
                          </button>
                        ))
                      ) : (
                          <p>Open</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
