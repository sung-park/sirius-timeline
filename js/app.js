const DATA_URL = "./data/timeline-2026-07-27.json";

const BEHAVIOR_STYLE = {
  수면: {
    accent: "#8B5CF6",
    soft: "#F0E9FF",
    icon: "moon",
  },
  돌아다니기: {
    accent: "#14B8A6",
    soft: "#E6F8F6",
    icon: "paw",
  },
  산책: {
    accent: "#22C55E",
    soft: "#E8F8EE",
    icon: "dog",
  },
  먹기: {
    accent: "#3B82F6",
    soft: "#E8F1FF",
    icon: "bone",
  },
  긁기: {
    accent: "#F97316",
    soft: "#FFF3E8",
    icon: "alert",
  },
  핥기: {
    accent: "#F97316",
    soft: "#FFF3E8",
    icon: "alert",
  },
};

/**
 * 필터 칩은 Improved 전용.
 * Default = 앱 as-is (칩/탭 없음).
 * Improved: (1) 인사이트 검증 · (2) 산책 회상 — 시나리오 칩 4개.
 */
const FILTER_CHIPS_IMPROVED = [
  { id: "all", label: "전체", scenario: null },
  { id: "산책", label: "산책", scenario: 2, labels: ["산책"] },
  {
    id: "daily",
    label: "일상행동",
    scenario: 1,
    labels: ["먹기", "마시기"],
  },
  {
    id: "negative",
    label: "부정행동",
    scenario: 1,
    labels: ["긁기", "핥기", "토하기"],
  },
];

/**
 * 보호자 시간 인지 단위 (데이파트).
 * hour in [startHour, endHour] inclusive.
 */
const DAY_PARTS = [
  { id: "dawn", label: "새벽", emoji: "🌌", startHour: 0, endHour: 5, range: "00–06시" },
  { id: "morning", label: "아침", emoji: "🌅", startHour: 6, endHour: 10, range: "06–11시" },
  { id: "midday", label: "점심", emoji: "☀️", startHour: 11, endHour: 16, range: "11–17시" },
  { id: "evening", label: "저녁", emoji: "🌇", startHour: 17, endHour: 20, range: "17–21시" },
  { id: "night", label: "밤", emoji: "🌙", startHour: 21, endHour: 23, range: "21–24시" },
];

const NEGATIVE_LABELS = new Set(["긁기", "핥기", "토하기"]);
const DAILY_LABELS = new Set(["먹기", "마시기"]);

const VIEW_HINTS = {
  default: "Default: 앱 as-is. 필터 칩 없이 최신순 카드 나열 (겹침 미병합).",
  improved:
    "Improved: 필터 칩 + 새벽·아침·점심·저녁·밤 섹션 + 24h 스트립 + 하이라이트 + 라벨 요약.",
};

const ICONS = {
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/><path d="M14 7h.01M17 10h.01"/></svg>`,
  paw: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="7.5" cy="8" r="2.1"/><circle cx="12" cy="6.2" r="2.1"/><circle cx="16.5" cy="8" r="2.1"/><circle cx="9" cy="12.2" r="1.7"/><circle cx="15" cy="12.2" r="1.7"/><path d="M8.2 15.4c.8-1.4 2-2.2 3.8-2.2s3 .8 3.8 2.2c.7 1.2.2 2.8-1.2 3.3-1 .4-2 .2-2.6-.4-.6.6-1.6.8-2.6.4-1.4-.5-1.9-2.1-1.2-3.3z"/></svg>`,
  bone: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.2 8.1a2.2 2.2 0 1 0-3.1 3.1l.5.5-1 1a2.2 2.2 0 1 0 3.1 3.1l1-1 .5.5a2.2 2.2 0 1 0 3.1-3.1l-.5-.5 5.2-5.2.5.5a2.2 2.2 0 1 0 3.1-3.1l-1-1 .5-.5a2.2 2.2 0 1 0-3.1-3.1l-.5.5-5.2 5.2-.5-.5a2.2 2.2 0 1 0-3.1 3.1z"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>`,
  dog: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 10.5c0-2 1.3-3.8 3.2-4.4L9 4l1.8 1.2c.4-.1.8-.2 1.2-.2.4 0 .8.1 1.2.2L15 4l1.3 2.1c1.9.6 3.2 2.4 3.2 4.4v1.2c0 .7-.1 1.4-.4 2l1.4 3.2c.3.7-.2 1.5-1 1.5h-1.3c-.4 2.1-2.2 3.6-4.4 3.6h-3.6c-2.2 0-4-1.5-4.4-3.6H4.5c-.8 0-1.3-.8-1-1.5l1.4-3.2c-.3-.6-.4-1.3-.4-2v-1.2z"/></svg>`,
};

/** @type {{ filter: string, view: "default" | "improved", data: object | null }} */
const state = {
  filter: "all",
  view: "default",
  data: null,
};

function parseDateParts(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return { y, m, d, date: new Date(y, m - 1, d) };
}

function parseHm(hm) {
  const [h, m] = String(hm).split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatHm(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dayPartForMinutes(mins) {
  const hour = Math.floor(mins / 60) % 24;
  return DAY_PARTS.find((p) => hour >= p.startHour && hour <= p.endHour) || DAY_PARTS[0];
}

function dayPartForEvent(event) {
  // 구간의 시작 시각 기준으로 배치 (보호자가 "그때 뭐 했지" 기억에 맞춤)
  return dayPartForMinutes(parseHm(event.start));
}

function activeFilterChips() {
  return state.view === "improved" ? FILTER_CHIPS_IMPROVED : [];
}

function buildWeekStrip(isoDate) {
  const { date } = parseDateParts(isoDate);
  const day = date.getDay(); // 0=Sun
  const start = new Date(date);
  start.setDate(date.getDate() - day);

  const dows = ["일", "월", "화", "수", "목", "금", "토"];
  const root = document.getElementById("weekStrip");
  root.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    const el = document.createElement("div");
    el.className = "week-day" + (cur.toDateString() === date.toDateString() ? " active" : "");
    el.innerHTML = `<span class="dow">${dows[i]}</span><span class="dom">${cur.getDate()}</span>`;
    root.appendChild(el);
  }
}

function styleFor(label) {
  return BEHAVIOR_STYLE[label] || { accent: "#94a3b8", soft: "#f1f5f9", icon: "alert" };
}

function metaText(event) {
  if (event.label === "산책") {
    const km = event.distanceKm != null ? `${event.distanceKm}km` : null;
    const min = event.durationMinutes != null ? `${event.durationMinutes}분` : null;
    const kcal = event.kcal != null ? `${event.kcal}kcal` : null;
    const segs = event._merged > 1 ? `${event._merged}구간` : null;
    return [km, min, kcal, segs].filter(Boolean).join(" · ");
  }
  const bits = [];
  if (event.count != null && event.count > 0) bits.push(`${event.count}회`);
  if (event.durationMinutes != null && event.durationMinutes > 0) {
    bits.push(`${event.durationMinutes}분`);
  }
  if (event._merged > 1) bits.push(`${event._merged}구간`);
  return bits.join(" · ");
}

function walkMapSvg(hint) {
  return `
    <svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="320" height="170" fill="#eef3ea"/>
      <path d="M0 78 H320" stroke="#c5cdd0" stroke-width="18" opacity="0.55"/>
      <path d="M0 78 H320" stroke="#dfe5e7" stroke-width="10"/>
      <rect x="210" y="20" width="70" height="50" rx="8" fill="#d7e8d2" opacity="0.9"/>
      <rect x="30" y="100" width="90" height="40" rx="8" fill="#d7e8d2" opacity="0.75"/>
      <path d="M150 20
               C148 40, 140 55, 155 70
               C170 85, 160 95, 145 100
               C120 110, 110 125, 130 140
               C150 155, 190 145, 210 130
               C230 115, 245 120, 250 140
               C255 155, 240 160, 225 150"
            fill="none" stroke="#2f6bff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="150" cy="20" r="4" fill="#2f6bff"/>
      <circle cx="225" cy="150" r="4" fill="#2f6bff"/>
      <text x="12" y="24" font-size="10" fill="#6b7280" font-family="system-ui,sans-serif">Google</text>
    </svg>
    <div class="map-label">${escapeHtml(hint || "산책 경로")}</div>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function countByLabel(events) {
  const counts = {};
  for (const e of events) {
    counts[e.label] = (counts[e.label] || 0) + 1;
  }
  return counts;
}

function chipMatchLabels(chip) {
  return chip.labels || (chip.id === "all" ? null : [chip.id]);
}

function countForChip(counts, chip) {
  if (chip.id === "all") return null;
  const labels = chipMatchLabels(chip) || [];
  return labels.reduce((sum, label) => sum + (counts[label] || 0), 0);
}

function filteredEvents(data, filterId) {
  const events = data.events || [];
  if (state.view === "default" || !filterId || filterId === "all") return events;
  const chip = activeFilterChips().find((c) => c.id === filterId);
  const labels = chip ? chipMatchLabels(chip) : null;
  if (!labels?.length) return events;
  const set = new Set(labels);
  return events.filter((e) => set.has(e.label));
}

const LABEL_PRIORITY = ["산책", "긁기", "핥기", "토하기", "먹기", "마시기", "수면", "돌아다니기"];

function labelSortKey(label) {
  const i = LABEL_PRIORITY.indexOf(label);
  return i === -1 ? 100 : i;
}

/**
 * 시간대 안에서는 동일 라벨을 하나로 요약.
 * (연속 병합은 행동 교차가 많아 효과가 거의 없음 → 라벨 단위 집계)
 */
function aggregateByLabel(events) {
  if (!events.length) return [];
  /** @type {Map<string, object>} */
  const map = new Map();
  for (const e of events) {
    const cur = map.get(e.label);
    const startM = parseHm(e.start);
    const endM = parseHm(e.end);
    if (!cur) {
      map.set(e.label, {
        ...e,
        _merged: 1,
        count: e.count ?? 0,
        durationMinutes: e.durationMinutes ?? 0,
        _minStart: Math.min(startM, endM),
        _maxEnd: Math.max(startM, endM),
      });
      continue;
    }
    cur._merged += 1;
    cur.count = (cur.count || 0) + (e.count || 0);
    cur.durationMinutes = (cur.durationMinutes || 0) + (e.durationMinutes || 0);
    cur._minStart = Math.min(cur._minStart, startM, endM);
    cur._maxEnd = Math.max(cur._maxEnd, startM, endM);
    if (e.distanceKm != null) cur.distanceKm = (cur.distanceKm || 0) + e.distanceKm;
    if (e.kcal != null) cur.kcal = (cur.kcal || 0) + e.kcal;
    if (e.mapHint && !cur.mapHint) cur.mapHint = e.mapHint;
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      start: formatHm(row._minStart),
      end: formatHm(row._maxEnd),
    }))
    .sort((a, b) => labelSortKey(a.label) - labelSortKey(b.label));
}

function buildFilterBar(data) {
  const bar = document.getElementById("filterBar");
  const root = document.getElementById("filterChips");
  root.innerHTML = "";

  // Default = 앱 as-is: 필터 칩 없음
  if (state.view === "default") {
    state.filter = "all";
    bar.hidden = true;
    bar.setAttribute("aria-hidden", "true");
    syncFilterMeta(data);
    return;
  }

  bar.hidden = false;
  bar.setAttribute("aria-hidden", "false");

  const counts = countByLabel(data.events || []);
  const chips = activeFilterChips();
  // Improved에서 수면 등 칩이 사라져 현재 필터가 무효면 전체로
  if (!chips.some((c) => c.id === state.filter)) {
    state.filter = "all";
  }

  for (const chip of chips) {
    const n = chip.id === "all" ? (data.events || []).length : countForChip(counts, chip);
    if (chip.id !== "all" && !n) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-chip" + (state.filter === chip.id ? " active" : "");
    btn.dataset.filter = chip.id;
    btn.setAttribute("aria-pressed", state.filter === chip.id ? "true" : "false");

    btn.innerHTML = `${escapeHtml(chip.label)}<span class="chip-count">${n}</span>`;
    btn.addEventListener("click", () => {
      if (state.filter === chip.id) return;
      state.filter = chip.id;
      syncFilterUi();
      renderTimeline();
      document.getElementById("timelineRoot").scrollTop = 0;
    });
    root.appendChild(btn);
  }

  syncFilterMeta(data);
}

function syncFilterUi() {
  document.querySelectorAll(".filter-chip").forEach((btn) => {
    const on = btn.dataset.filter === state.filter;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  if (state.data) syncFilterMeta(state.data);
}

function syncFilterMeta(data) {
  const meta = document.getElementById("filterMeta");
  if (state.view === "default") {
    meta.textContent = "";
    return;
  }

  const total = (data.events || []).length;
  const shown = filteredEvents(data, state.filter).length;
  const chip = activeFilterChips().find((c) => c.id === state.filter);

  if (state.filter === "all") {
    meta.textContent = `하루 전체 · ${total}건 · 시간대 묶음`;
    return;
  }

  const scenarioHint =
    chip?.scenario === 2 ? "산책 회상" : chip?.scenario === 1 ? "인사이트 검증" : "";
  meta.textContent = scenarioHint
    ? `${chip.label} · ${shown}건 · ${scenarioHint}`
    : `${chip?.label || state.filter} · ${shown}건`;
}

function createEventCard(event, { compactWalk = false } = {}) {
  const style = styleFor(event.label);
  const item = document.createElement("article");
  item.className = "timeline-item";
  item.style.setProperty("--dot", style.accent);
  item.dataset.id = String(event.id);
  item.dataset.label = event.label;
  if (event._merged > 1) item.dataset.merged = String(event._merged);

  const isWalk = event.label === "산책";
  const showMap = isWalk && !compactWalk;

  item.innerHTML = `
    <div class="dot" aria-hidden="true"></div>
    <div class="time-range">${escapeHtml(event.start)} - ${escapeHtml(event.end)}</div>
    <div class="card ${isWalk ? "walk" : ""} ${event._merged > 1 ? "merged" : ""}" style="--accent:${style.accent};--soft:${style.soft}">
      ${
        showMap
          ? `<div class="walk-head">
              <div class="icon">${ICONS[style.icon]}</div>
              <div class="body">
                <div class="label">${escapeHtml(event.label)}</div>
                <div class="meta">${escapeHtml(metaText(event))}</div>
              </div>
            </div>
            <div class="map">${walkMapSvg(event.mapHint)}</div>`
          : `<div class="icon">${ICONS[style.icon] || ICONS.alert}</div>
             <div class="body">
               <div class="label">${escapeHtml(event.label)}</div>
               <div class="meta">${escapeHtml(metaText(event))}</div>
             </div>`
      }
    </div>
  `;
  return item;
}

/**
 * Default (as-is) view with optional label filter:
 * - Keep reverse-chronological order
 * - No merge / clipping of overlaps
 */
function renderDefault(data) {
  const root = document.getElementById("timelineRoot");
  const events = filteredEvents(data, state.filter);

  document.getElementById("statCount").textContent = String(events.length);

  if (events.length === 0) {
    root.innerHTML = `
      <div class="empty-filter">
        <strong>해당 행동이 없어요</strong>
        다른 필터를 선택해 보세요.
      </div>`;
    return;
  }

  const list = document.createElement("div");
  list.className = "timeline";
  list.setAttribute("data-view", "default");
  list.setAttribute("data-filter", state.filter);

  for (const event of events) {
    list.appendChild(createEventCard(event));
  }

  root.innerHTML = "";
  root.appendChild(list);
}

function summarizeDay(events) {
  const counts = countByLabel(events);
  const walkEvents = events.filter((e) => e.label === "산책");
  const negEvents = events.filter((e) => NEGATIVE_LABELS.has(e.label));
  const dailyEvents = events.filter((e) => DAILY_LABELS.has(e.label));
  const sleepMin = events
    .filter((e) => e.label === "수면")
    .reduce((s, e) => s + (e.durationMinutes || 0), 0);

  const walkMeta = walkEvents.map((e) => metaText(e)).filter(Boolean).join(" · ");
  const negByLabel = {};
  for (const e of negEvents) {
    negByLabel[e.label] = (negByLabel[e.label] || 0) + (e.count || 1);
  }
  const negDetail = Object.entries(negByLabel)
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ");

  return {
    counts,
    walkCount: walkEvents.length,
    walkMeta,
    negCount: negEvents.reduce((s, e) => s + (e.count || 1), 0),
    negDetail,
    dailyCount: dailyEvents.reduce((s, e) => s + (e.count || 1), 0),
    sleepMin,
  };
}

/** 분 단위 버킷으로 24h 스트립 세그먼트 생성 (표시용 단순화) */
function buildDayStripSegments(events) {
  // 1분 그리드에 마지막 덮어쓰기 (겹치면 나중 이벤트가 우선 — 입력은 최신순이므로 reverse 후 적용)
  const grid = new Array(24 * 60).fill(null);
  const chrono = [...events].sort((a, b) => parseHm(a.start) - parseHm(b.start));
  for (const e of chrono) {
    let a = parseHm(e.start);
    let b = parseHm(e.end);
    if (b < a) b = a;
    // instant: 최소 8분 폭으로 보이게
    if (b - a < 8) b = Math.min(a + 8, 24 * 60 - 1);
    for (let t = a; t <= b && t < grid.length; t++) {
      grid[t] = e.label;
    }
  }

  const segments = [];
  let i = 0;
  while (i < grid.length) {
    const label = grid[i];
    if (!label) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < grid.length && grid[j] === label) j++;
    segments.push({
      label,
      startMin: i,
      endMin: j - 1,
      left: (i / (24 * 60)) * 100,
      width: ((j - i) / (24 * 60)) * 100,
    });
    i = j;
  }
  return segments;
}

function renderDayStrip(events) {
  const wrap = document.createElement("div");
  wrap.className = "day-strip";
  wrap.setAttribute("aria-label", "하루 행동 요약 스트립");

  const track = document.createElement("div");
  track.className = "day-strip-track";

  for (const seg of buildDayStripSegments(events)) {
    const style = styleFor(seg.label);
    const el = document.createElement("button");
    el.type = "button";
    el.className = "day-strip-seg";
    el.style.left = `${seg.left}%`;
    el.style.width = `${Math.max(seg.width, 0.35)}%`;
    el.style.background = style.accent;
    el.title = `${seg.label} ${formatHm(seg.startMin)}–${formatHm(seg.endMin)}`;
    el.addEventListener("click", () => {
      const part = dayPartForMinutes(seg.startMin);
      const target = document.getElementById(`daypart-${part.id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("flash");
        setTimeout(() => target.classList.remove("flash"), 900);
      }
    });
    track.appendChild(el);
  }

  const ticks = document.createElement("div");
  ticks.className = "day-strip-ticks";
  for (const h of [0, 6, 12, 18, 24]) {
    const t = document.createElement("span");
    t.textContent = h === 24 ? "24" : String(h).padStart(2, "0");
    t.style.left = `${(h / 24) * 100}%`;
    ticks.appendChild(t);
  }

  const parts = document.createElement("div");
  parts.className = "day-strip-parts";
  for (const p of DAY_PARTS) {
    const start = p.startHour;
    const end = p.endHour + 1;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "day-strip-part";
    el.style.left = `${(start / 24) * 100}%`;
    el.style.width = `${((end - start) / 24) * 100}%`;
    el.textContent = p.label;
    el.title = `${p.label} ${p.range}`;
    el.addEventListener("click", () => {
      const target = document.getElementById(`daypart-${p.id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("flash");
        setTimeout(() => target.classList.remove("flash"), 900);
      }
    });
    parts.appendChild(el);
  }

  wrap.appendChild(track);
  wrap.appendChild(ticks);
  wrap.appendChild(parts);
  return wrap;
}

function renderHighlights(summary) {
  const el = document.createElement("div");
  el.className = "day-highlights";
  el.setAttribute("aria-label", "오늘 하이라이트");

  const pills = [];

  if (summary.walkCount > 0) {
    pills.push({
      className: "hl-walk",
      title: "산책",
      body: summary.walkMeta || `${summary.walkCount}회`,
      filter: "산책",
    });
  } else {
    pills.push({
      className: "hl-muted",
      title: "산책",
      body: "기록 없음",
      filter: "산책",
    });
  }

  pills.push({
    className: summary.negCount > 0 ? "hl-neg" : "hl-muted",
    title: "부정행동",
    body: summary.negCount > 0 ? `${summary.negCount}회 · ${summary.negDetail}` : "없음",
    filter: "negative",
  });

  pills.push({
    className: "hl-daily",
    title: "일상",
    body: `먹기 등 ${summary.dailyCount}회`,
    filter: "daily",
  });

  const sleepH = Math.floor(summary.sleepMin / 60);
  const sleepM = summary.sleepMin % 60;
  pills.push({
    className: "hl-sleep",
    title: "수면",
    body: summary.sleepMin > 0 ? `${sleepH}시간 ${sleepM}분` : "–",
    filter: "all",
  });

  for (const p of pills) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `hl-pill ${p.className}`;
    btn.innerHTML = `<span class="hl-title">${escapeHtml(p.title)}</span><span class="hl-body">${escapeHtml(p.body)}</span>`;
    btn.addEventListener("click", () => {
      if (p.filter === state.filter) return;
      // 수면은 improved 칩에 없으므로 전체 유지 + 스크롤만
      if (p.filter !== "all" && activeFilterChips().some((c) => c.id === p.filter)) {
        state.filter = p.filter;
        if (state.data) {
          buildFilterBar(state.data);
          renderTimeline();
        }
      }
    });
    el.appendChild(btn);
  }

  return el;
}

function groupByDayPart(events) {
  /** @type {Map<string, object[]>} */
  const map = new Map(DAY_PARTS.map((p) => [p.id, []]));
  for (const e of events) {
    const part = dayPartForEvent(e);
    map.get(part.id).push(e);
  }
  return map;
}

function daypartBreakdown(events) {
  const counts = countByLabel(events);
  return Object.entries(counts)
    .sort((a, b) => labelSortKey(a[0]) - labelSortKey(b[0]))
    .map(([label, n]) => {
      const style = styleFor(label);
      return `<span class="dp-chip"><i style="background:${style.accent}"></i>${escapeHtml(label)} ${n}</span>`;
    })
    .join("");
}

/**
 * Improved view:
 * - 하이라이트 + 24h 스트립
 * - 새벽·아침·점심·저녁·밤 섹션 (최신 시간대 우선)
 * - 섹션 내 라벨별 요약 카드 (원본 건수 → 행동 종류 수로 압축)
 */
function renderImproved(data) {
  const root = document.getElementById("timelineRoot");
  // 스트립·하이라이트는 필터 전 하루 전체 기준
  const allEvents = data.events || [];
  const filtered = filteredEvents(data, state.filter);

  document.getElementById("statCount").textContent = String(filtered.length);

  const shell = document.createElement("div");
  shell.className = "improved-shell";
  shell.setAttribute("data-view", "improved");
  shell.setAttribute("data-filter", state.filter);

  const summary = summarizeDay(allEvents);
  shell.appendChild(renderHighlights(summary));
  shell.appendChild(renderDayStrip(allEvents));

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-filter";
    empty.innerHTML = `<strong>해당 행동이 없어요</strong>다른 필터를 선택해 보세요.`;
    shell.appendChild(empty);
    root.innerHTML = "";
    root.appendChild(shell);
    return;
  }

  const byPart = groupByDayPart(filtered);
  // 앱 타임라인 습관: 최근이 위 → 밤 → … → 새벽
  const partsNewestFirst = [...DAY_PARTS].reverse();

  for (const part of partsNewestFirst) {
    const raw = byPart.get(part.id) || [];
    if (!raw.length) continue;

    const aggregated = aggregateByLabel(raw);

    const section = document.createElement("section");
    section.className = "daypart-section";
    section.id = `daypart-${part.id}`;
    section.dataset.part = part.id;

    const header = document.createElement("header");
    header.className = "daypart-header";
    header.innerHTML = `
      <div class="daypart-title-row">
        <div class="daypart-title">
          <span class="daypart-emoji" aria-hidden="true">${part.emoji}</span>
          <strong>${escapeHtml(part.label)}</strong>
          <span class="daypart-range">${escapeHtml(part.range)}</span>
        </div>
        <div class="daypart-meta">원본 ${raw.length} · 요약 ${aggregated.length}</div>
      </div>
      <div class="daypart-breakdown">${daypartBreakdown(raw)}</div>
    `;
    section.appendChild(header);

    const list = document.createElement("div");
    list.className = "timeline timeline--improved";
    // 전체 뷰에서는 맵 접기 → 산책 필터에서만 경로 펼침
    const expandWalkMap = state.filter === "산책";
    for (const event of aggregated) {
      list.appendChild(
        createEventCard(event, {
          compactWalk: event.label === "산책" ? !expandWalkMap : false,
        }),
      );
    }

    section.appendChild(list);
    shell.appendChild(section);
  }

  root.innerHTML = "";
  root.appendChild(shell);
}

function renderTimeline() {
  if (!state.data) return;
  document.getElementById("deviceFrame")?.setAttribute("data-view", state.view);
  if (state.view === "improved") {
    renderImproved(state.data);
  } else {
    renderDefault(state.data);
  }
}

function renderLegend(data) {
  const counts = countByLabel(data.events || []);
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  for (const [label, count] of Object.entries(counts)) {
    const style = styleFor(label);
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="left"><span class="swatch" style="background:${style.accent}"></span>${escapeHtml(label)}</span>
      <span class="count">${count}</span>
    `;
    legend.appendChild(li);
  }

  document.getElementById("statDate").textContent = data.date?.slice(5) || "–";
}

function setupViewTabs() {
  const tabs = document.querySelectorAll(".view-tab");
  const hint = document.getElementById("viewHint");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const view = tab.dataset.view;
      if (!view || view === state.view) return;
      state.view = view;
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (hint) hint.textContent = VIEW_HINTS[view] || "";
      if (state.data) {
        buildFilterBar(state.data);
        renderTimeline();
        document.getElementById("timelineRoot").scrollTop = 0;
      }
    });
  });
}

async function main() {
  setupViewTabs();
  const root = document.getElementById("timelineRoot");

  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.data = data;

    buildWeekStrip(data.date);
    buildFilterBar(data);
    renderLegend(data);
    renderTimeline();
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="error">타임라인 데이터를 불러오지 못했습니다.<br/><small>${escapeHtml(
      String(err.message || err),
    )}</small><br/><small>로컬 서버로 열어주세요: <code>python3 -m http.server 5173</code></small></div>`;
  }
}

main();
