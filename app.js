const DEFAULT_CONFIG = {
  locationName: "לימסול",
  latitude: 34.6786,
  longitude: 33.0413,
  elevation: 22,
  timeZoneId: "Asia/Nicosia",
  rounding: "nearest"
};

const ZMAN_DEFINITIONS = [
  {
    key: "alos",
    label: "עלות השחר",
    detail: "בעל התניא, 16.9° מתחת לאופק",
    method: (calendar) => calendar.getAlosBaalHatanya()
  },
  {
    key: "sunrise",
    label: "הנץ החמה",
    detail: "זריחה רגילה לפי תצוגת חב״ד",
    method: (calendar) => calendar.getSunrise()
  },
  {
    key: "sofShma",
    label: "סוף זמן קריאת שמע",
    detail: "לפי בעל התניא",
    method: (calendar) => calendar.getSofZmanShmaBaalHatanya()
  },
  {
    key: "sofTfila",
    label: "סוף זמן תפילה",
    detail: "לפי בעל התניא",
    method: (calendar) => calendar.getSofZmanTfilaBaalHatanya()
  },
  {
    key: "chatzos",
    label: "חצות היום",
    detail: "אמצע היום השמשי",
    method: (calendar) => calendar.getChatzos()
  },
  {
    key: "minchaGedola",
    label: "מנחה גדולה",
    detail: "לפי בעל התניא",
    method: (calendar) => calendar.getMinchaGedolaBaalHatanya()
  },
  {
    key: "minchaKetana",
    label: "מנחה קטנה",
    detail: "לפי בעל התניא",
    method: (calendar) => calendar.getMinchaKetanaBaalHatanya()
  },
  {
    key: "plag",
    label: "פלג המנחה",
    detail: "לפי בעל התניא",
    method: (calendar) => calendar.getPlagHaminchaBaalHatanya()
  },
  {
    key: "sunset",
    label: "שקיעה",
    detail: "שקיעה רגילה לפי תצוגת חב״ד",
    method: (calendar) => calendar.getSunset()
  },
  {
    key: "tzais",
    label: "צאת הכוכבים",
    detail: "בעל התניא, 6° מתחת לאופק",
    method: (calendar) => calendar.getTzaisBaalHatanya()
  }
];

const els = {
  locationName: document.getElementById("location-name"),
  dateLabel: document.getElementById("date-label"),
  currentTime: document.getElementById("current-time"),
  shabbatTitle: document.getElementById("shabbat-title"),
  candleDate: document.getElementById("candle-date"),
  candleTime: document.getElementById("candle-time"),
  havdalahDate: document.getElementById("havdalah-date"),
  havdalahTime: document.getElementById("havdalah-time"),
  grid: document.getElementById("zmanim-grid")
};

function parseConfig() {
  const params = new URLSearchParams(window.location.search);
  const numberParam = (key, fallback) => {
    const value = Number.parseFloat(params.get(key) || "");
    return Number.isFinite(value) ? value : fallback;
  };

  const rounding = params.get("rounding");

  return {
    locationName: params.get("name") || DEFAULT_CONFIG.locationName,
    latitude: numberParam("lat", DEFAULT_CONFIG.latitude),
    longitude: numberParam("lng", DEFAULT_CONFIG.longitude),
    elevation: numberParam("elevation", DEFAULT_CONFIG.elevation),
    timeZoneId: params.get("tz") || DEFAULT_CONFIG.timeZoneId,
    rounding: ["nearest", "up", "down"].includes(rounding) ? rounding : DEFAULT_CONFIG.rounding
  };
}

function getDisplayDateParts(timeZoneId) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZoneId,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return { year, month, day };
}

function getLocation(config) {
  const { GeoLocation } = window.KosherZmanim;
  return new GeoLocation(
    config.locationName,
    config.latitude,
    config.longitude,
    config.elevation,
    config.timeZoneId
  );
}

function getCalendarForDate(config, date) {
  const { ComplexZmanimCalendar } = window.KosherZmanim;
  const calendar = new ComplexZmanimCalendar(getLocation(config));
  calendar.setDate(date);
  return calendar;
}

function getCalendarForToday(config) {
  const { DateTime } = window.KosherZmanim;
  const dateParts = getDisplayDateParts(config.timeZoneId);
  const date = DateTime.fromObject(
    {
      year: Number(dateParts.year),
      month: Number(dateParts.month),
      day: Number(dateParts.day),
      hour: 12
    },
    { zone: config.timeZoneId }
  );
  return getCalendarForDate(config, date);
}

function roundDateTime(dateTime, strategy) {
  if (!dateTime || !dateTime.isValid) {
    return null;
  }

  const seconds = dateTime.second + (dateTime.millisecond / 1000);
  const zeroed = dateTime.set({ second: 0, millisecond: 0 });

  if (strategy === "down") {
    return zeroed;
  }

  if (strategy === "up") {
    return seconds === 0 ? zeroed : zeroed.plus({ minutes: 1 });
  }

  return seconds >= 30 ? zeroed.plus({ minutes: 1 }) : zeroed;
}

function formatTime(dateTime, timeZoneId) {
  if (!dateTime) {
    return "--";
  }

  return dateTime
    .setZone(timeZoneId)
    .toLocaleString({
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
}

function formatCurrentTime(timeZoneId) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: timeZoneId,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());
}

function formatDateLabel(timeZoneId) {
  const civil = new Intl.DateTimeFormat("he-IL", {
    timeZone: timeZoneId,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  const hebrew = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
    timeZone: timeZoneId,
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  return `${civil} • ${hebrew}`;
}

function formatHebrewShortDate(dateTime, timeZoneId) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: timeZoneId,
    weekday: "long",
    day: "numeric",
    month: "numeric"
  }).format(dateTime.toJSDate());
}

function getNextZman(zmanim, timeZoneId) {
  const now = window.KosherZmanim.DateTime.now().setZone(timeZoneId);

  for (const zman of zmanim) {
    if (zman.dateTime && zman.dateTime > now) {
      return zman;
    }
  }

  return null;
}

function getUpcomingShabbat(config) {
  const { DateTime } = window.KosherZmanim;
  const now = DateTime.now().setZone(config.timeZoneId);
  const weekStart = now.startOf("week");

  for (let weekOffset = 0; weekOffset < 3; weekOffset += 1) {
    const friday = weekStart.plus({ weeks: weekOffset, days: 4, hours: 12 });
    const saturday = friday.plus({ days: 1 });
    const fridayCalendar = getCalendarForDate(config, friday);
    const saturdayCalendar = getCalendarForDate(config, saturday);
    const sunset = fridayCalendar.getSunset();
    const tzais = saturdayCalendar.getTzaisGeonim8Point5Degrees();

    if (!sunset || !tzais) {
      continue;
    }

    const candleLighting = roundDateTime(
      sunset.setZone(config.timeZoneId).minus({ minutes: 18 }),
      config.rounding
    );
    const shabbatEnds = roundDateTime(
      tzais.setZone(config.timeZoneId),
      config.rounding
    );

    if (shabbatEnds && shabbatEnds > now) {
      return {
        friday,
        saturday,
        candleLighting,
        shabbatEnds
      };
    }
  }

  return null;
}

function renderShabbatPanel(config) {
  const shabbat = getUpcomingShabbat(config);

  if (!shabbat) {
    els.shabbatTitle.textContent = "לא נמצאו זמני שבת";
    els.candleDate.textContent = "--";
    els.candleTime.textContent = "--:--";
    els.havdalahDate.textContent = "--";
    els.havdalahTime.textContent = "--:--";
    return;
  }

  els.shabbatTitle.textContent = config.locationName;
  els.candleDate.textContent = formatHebrewShortDate(shabbat.friday, config.timeZoneId);
  els.candleTime.textContent = formatTime(shabbat.candleLighting, config.timeZoneId);
  els.havdalahDate.textContent = formatHebrewShortDate(shabbat.saturday, config.timeZoneId);
  els.havdalahTime.textContent = formatTime(shabbat.shabbatEnds, config.timeZoneId);
}

function renderGrid(zmanim, nextKey, config) {
  els.grid.innerHTML = "";
  const now = window.KosherZmanim.DateTime.now().setZone(config.timeZoneId);

  for (const zman of zmanim) {
    const card = document.createElement("article");
    const isPast = zman.dateTime && zman.dateTime <= now;
    card.className = `zman-card${zman.key === nextKey ? " zman-card--next" : ""}${isPast ? " zman-card--past" : ""}`;
    card.innerHTML = `
      <div class="zman-card__meta">
        <div>
        <p class="zman-card__label">${zman.label}</p>
        <p class="zman-card__detail">${zman.detail}</p>
        </div>
      </div>
      <div class="zman-card__time">${formatTime(zman.dateTime, config.timeZoneId)}</div>
    `;
    els.grid.appendChild(card);
  }
}

function render(config) {
  if (!window.KosherZmanim) {
    els.shabbatTitle.textContent = "טעינת הספרייה נכשלה";
    els.candleDate.textContent = "--";
    els.candleTime.textContent = "בדוק רשת";
    els.havdalahDate.textContent = "--";
    els.havdalahTime.textContent = "בדוק רשת";
    return;
  }

  const calendar = getCalendarForToday(config);
  const zmanim = ZMAN_DEFINITIONS.map((definition) => {
    const raw = definition.method(calendar);
    const zoned = raw ? raw.setZone(config.timeZoneId) : null;

    return {
      ...definition,
      dateTime: roundDateTime(zoned, config.rounding)
    };
  });
  const nextZman = getNextZman(zmanim, config.timeZoneId);

  els.locationName.textContent = config.locationName;
  els.dateLabel.textContent = formatDateLabel(config.timeZoneId);
  els.currentTime.textContent = formatCurrentTime(config.timeZoneId);
  renderShabbatPanel(config);
  renderGrid(zmanim, nextZman?.key, config);
}

function startClock(config) {
  render(config);
  setInterval(() => {
    els.currentTime.textContent = formatCurrentTime(config.timeZoneId);
  }, 1000);

  setInterval(() => {
    render(config);
  }, 60000);
}

window.addEventListener("load", () => {
  const config = parseConfig();
  startClock(config);
});
