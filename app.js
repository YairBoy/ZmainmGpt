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
  infoTitle: document.getElementById("info-title"),
  infoSubtitle: document.getElementById("info-subtitle"),
  shabbatTitle: document.getElementById("shabbat-title"),
  candleDate: document.getElementById("candle-date"),
  candleTime: document.getElementById("candle-time"),
  havdalahDate: document.getElementById("havdalah-date"),
  havdalahTime: document.getElementById("havdalah-time"),
  grid: document.getElementById("zmanim-grid")
};

const MEMORIAL_SOURCE_PATHS = [
  "./data/memorials.xlsx",
  "./data/memorials.xls",
  "./data/memorials.csv"
];

function ensureMemorialNamesElement() {
  let element = document.getElementById("info-names");
  if (!element) {
    element = document.createElement("p");
    element.id = "info-names";
    element.className = "info-panel__names";
    els.infoSubtitle.insertAdjacentElement("afterend", element);
  }
  return element;
}

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
  const weekday = new Intl.DateTimeFormat("he-IL", {
    timeZone: timeZoneId,
    weekday: "long"
  }).format(new Date());
  const gregorian = new Intl.DateTimeFormat("he-IL", {
    timeZone: timeZoneId,
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const hebrew = formatHebrewDateWithLetters(timeZoneId);

  return `${weekday} • ${hebrew} • ${gregorian}`;
}

function toHebrewNumeral(number) {
  if (!Number.isFinite(number) || number <= 0) {
    return "";
  }

  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת"];
  const special = {
    15: "טו",
    16: "טז"
  };

  let value = Math.floor(number);
  let result = "";

  while (value >= 400) {
    result += "ת";
    value -= 400;
  }

  if (value >= 100) {
    const count = Math.floor(value / 100);
    result += hundreds[count];
    value %= 100;
  }

  if (special[value]) {
    result += special[value];
    value = 0;
  }

  if (value >= 10) {
    const count = Math.floor(value / 10);
    result += tens[count];
    value %= 10;
  }

  if (value > 0) {
    result += ones[value];
  }

  if (result.length <= 1) {
    return `${result}'`;
  }

  return `${result.slice(0, -1)}"${result.slice(-1)}`;
}

function formatHebrewDateWithLetters(timeZoneId) {
  const parts = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
    timeZone: timeZoneId,
    day: "numeric",
    month: "long",
    year: "numeric"
  }).formatToParts(new Date());

  const day = Number(parts.find((part) => part.type === "day")?.value || 0);
  const month = parts.find((part) => part.type === "month")?.value || "";
  const year = Number(parts.find((part) => part.type === "year")?.value || 0);
  const hebrewYear = year > 5000 ? year - 5000 : year;

  return `${toHebrewNumeral(day)} ${month} ה׳${toHebrewNumeral(hebrewYear)}`;
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

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function parseHebrewNumber(rawValue) {
  if (typeof rawValue === "number") {
    return rawValue;
  }

  const text = String(rawValue || "")
    .replace(/['"׳״\s]/g, "")
    .trim();

  if (!text) {
    return NaN;
  }

  if (/^\d+$/.test(text)) {
    return Number(text);
  }

  const values = {
    א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9,
    י: 10, כ: 20, ך: 20, ל: 30, מ: 40, ם: 40, נ: 50, ן: 50,
    ס: 60, ע: 70, פ: 80, ף: 80, צ: 90, ץ: 90,
    ק: 100, ר: 200, ש: 300, ת: 400
  };

  let total = 0;
  for (const char of text) {
    total += values[char] || 0;
  }

  return total;
}

function normalizeHebrewDay(rawValue) {
  const numeric = parseHebrewNumber(rawValue);
  return Number.isFinite(numeric) ? String(numeric) : "";
}

function normalizeHebrewYear(rawValue) {
  const numeric = parseHebrewNumber(rawValue);
  if (!Number.isFinite(numeric)) {
    return "";
  }
  return String(numeric < 1000 ? numeric + 5000 : numeric);
}

function parseMemorialEntriesFromRows(rows) {
  return rows
    .map((row) => {
      const normalized = Object.fromEntries(
        Object.entries(row || {}).map(([key, value]) => [normalizeKey(key), value])
      );

      return {
        name: String(normalized.name || normalized["שם"] || "").trim(),
        day: normalizeHebrewDay(normalized.day || normalized["יום"]),
        month: String(normalized.month || normalized["חודש"] || "").trim(),
        year: normalizeHebrewYear(normalized.year || normalized["שנה"]),
        afterSunset: String(
          normalized.aftersunset ||
          normalized.afterset ||
          normalized["אחרישקיעה"] ||
          normalized["אחרישקיעה?"] ||
          "false"
        ).trim()
      };
    })
    .filter((entry) => entry.name && entry.day && entry.month && entry.year);
}

async function fetchMemorialEntriesFile() {
  for (const path of MEMORIAL_SOURCE_PATHS) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      if (path.endsWith(".csv")) {
        const text = await response.text();
        const workbook = window.XLSX.read(text, { type: "string" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        return parseMemorialEntriesFromRows(window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" }));
      }

      const buffer = await response.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return parseMemorialEntriesFromRows(window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" }));
    } catch {
      continue;
    }
  }

  return [];
}

async function fetchMemorialForToday(entries, config) {
  if (entries.length === 0) {
    return [];
  }

  const today = window.KosherZmanim.DateTime.now().setZone(config.timeZoneId).toISODate();
  const params = new URLSearchParams({
    cfg: "json",
    v: "yahrzeit",
    years: "1",
    hebdate: "on"
  });

  entries.forEach((entry, index) => {
    const position = index + 1;
    params.set(`n${position}`, entry.name);
    params.set(`t${position}`, "Yahrzeit");
    params.set(`hd${position}`, String(entry.day));
    params.set(`hm${position}`, entry.month);
    params.set(`hy${position}`, String(entry.year));
    if (/^(true|on|1|yes)$/i.test(entry.afterSunset)) {
      params.set(`s${position}`, "on");
    }
  });

  const response = await fetch("https://www.hebcal.com/yahrzeit", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`Yahrzeit request failed with ${response.status}`);
  }

  const data = await response.json();
  return (data.items || []).filter((item) => item.date === today);
}

async function renderInfoPanel(config) {
  const namesElement = ensureMemorialNamesElement();
  namesElement.textContent = "";

  const entries = await fetchMemorialEntriesFile();
  if (entries.length === 0) {
    els.infoTitle.textContent = "אין אזכרה היום";
    els.infoSubtitle.textContent = "לא נמצא קובץ הנצחה באתר";
    return;
  }

  try {
    const matches = await fetchMemorialForToday(entries, config);
    if (matches.length === 0) {
      els.infoTitle.textContent = "אין אזכרה היום";
      els.infoSubtitle.textContent = `${entries.length} שמות נטענו מקובץ ההנצחה`;
      return;
    }

    const names = matches.map((item) => item.name || item.title).filter(Boolean);
    const anniversaryText = matches.length === 1
      ? `היום יום האזכרה של ${names[0]}`
      : `היום יום האזכרה של ${matches.length} נפטרים`;

    els.infoTitle.textContent = "נזכרים היום";
    els.infoSubtitle.textContent = anniversaryText;
    namesElement.textContent = names.join("\n");
  } catch (error) {
    els.infoTitle.textContent = "שגיאה בטעינת אזכרה";
    els.infoSubtitle.textContent = "בדוק את קובץ ההנצחה או את החיבור לרשת";
    namesElement.textContent = "";
  }
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
      <div class="zman-card__time">${formatTime(zman.dateTime, config.timeZoneId)}</div>
      <div class="zman-card__meta">
        <div>
          <p class="zman-card__label">${zman.label}</p>
          <p class="zman-card__detail">${zman.detail}</p>
        </div>
      </div>
    `;
    els.grid.appendChild(card);
  }
}

function render(config) {
  if (!window.KosherZmanim) {
    els.infoTitle.textContent = "טעינת הספרייה נכשלה";
    els.infoSubtitle.textContent = "--";
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
  renderInfoPanel(config);
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
