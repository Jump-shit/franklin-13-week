const quotes = [
  {
    quote: "Early to bed and early to rise makes a man healthy, wealthy, and wise.",
    meaning: "Build a disciplined rhythm: protect your sleep, wake with intention, and start the day before distractions take over."
  },
  {
    quote: "Lost time is never found again.",
    meaning: "Treat time as a limited resource. Once a day is gone, it cannot be recovered."
  },
  {
    quote: "Diligence is the mother of good luck.",
    meaning: "Consistent effort creates opportunities that can look like luck from the outside."
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    meaning: "Spend time learning. Knowledge compounds and can keep paying you back for years."
  },
  {
    quote: "Well done is better than well said.",
    meaning: "Let your actions carry more weight than your intentions or promises."
  },
  {
    quote: "By failing to prepare, you are preparing to fail.",
    meaning: "Preparation reduces avoidable mistakes and gives you control before the important moment arrives."
  },
  {
    quote: "He that can have patience can have what he will.",
    meaning: "Patience makes long-term goals possible. Do not trade your future for a quick reward."
  },
  {
    quote: "Either write something worth reading or do something worth writing.",
    meaning: "Make your work meaningful. Create something useful instead of merely staying busy."
  },
  {
    quote: "Energy and persistence conquer all things.",
    meaning: "Keep moving when progress is slow. Persistence is often what separates a temporary setback from the end."
  },
  {
    quote: "Never leave till tomorrow that which you can do today.",
    meaning: "When a task is small and actionable, doing it now prevents a pile-up of unfinished work."
  },
  {
    quote: "A penny saved is a penny earned.",
    meaning: "Financial progress is not only about earning more. Keeping what you earn matters too."
  },
  {
    quote: "He that is good for making excuses is seldom good for anything else.",
    meaning: "Take responsibility for what you can control instead of spending your energy explaining why something did not happen."
  },
  {
    quote: "If you would have a faithful servant, and one that you like, serve yourself.",
    meaning: "Self-discipline begins with taking responsibility for your own work rather than waiting for someone else to do it."
  }
];

const STORAGE_KEY = "franklin13-progress-v1";
const START_KEY = "franklin13-start-date-v1";

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDays(a, b) {
  return Math.floor((startOfDay(a) - startOfDay(b)) / 86400000);
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "long", day: "numeric"
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric"
  }).format(date);
}

function getStartDate() {
  let stored = localStorage.getItem(START_KEY);
  if (!stored) {
    stored = dateKey(new Date());
    localStorage.setItem(START_KEY, stored);
  }
  return parseDateKey(stored);
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getState() {
  const today = startOfDay(new Date());
  const start = getStartDate();
  const dayIndex = diffDays(today, start);

  // Before the 13-week journey starts (only possible after a manual reset/date change).
  if (dayIndex < 0) return { dayIndex: 0, weekIndex: 0, dayInWeek: 0, start, today };
  return {
    dayIndex,
    weekIndex: Math.min(12, Math.floor(dayIndex / 7)),
    dayInWeek: dayIndex % 7,
    start,
    today
  };
}

function isWithinJourney(state) {
  return state.dayIndex >= 0 && state.dayIndex < 91;
}

function render() {
  const state = getState();
  const progress = loadProgress();
  const todayKey = dateKey(state.today);
  const currentQuote = quotes[state.weekIndex];

  document.getElementById("weekday").textContent =
    new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(state.today);
  document.getElementById("date").textContent = formatDate(state.today);

  const weekStart = new Date(state.start);
  weekStart.setDate(weekStart.getDate() + state.weekIndex * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  document.getElementById("weekTitle").textContent = `Week ${state.weekIndex + 1}`;
  document.getElementById("weekRange").textContent =
    `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`;
  document.getElementById("weekNumber").textContent =
    `WEEK ${String(state.weekIndex + 1).padStart(2, "0")}`;
  document.getElementById("quote").textContent = `“${currentQuote.quote}”`;
  document.getElementById("meaning").textContent = currentQuote.meaning;

  const todayDone = Boolean(progress[todayKey]);
  const button = document.getElementById("completeButton");
  button.classList.toggle("done", todayDone);
  document.getElementById("buttonText").textContent =
    todayDone ? "Completed today" : "Mark today as complete";
  document.getElementById("todayStatus").textContent =
    todayDone ? "Completed ✓" : "Not completed";
  document.getElementById("todayStatus").classList.toggle("done", todayDone);

  const weekCompleted = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return Boolean(progress[dateKey(d)]);
  }).filter(Boolean).length;

  const totalCompleted = Object.values(progress).filter(Boolean).length;
  document.getElementById("progressText").textContent =
    `${weekCompleted} / 7 days completed`;
  document.getElementById("totalText").textContent =
    `${Math.min(totalCompleted, 91)} / 91 total days`;
  document.getElementById("progressBar").style.width =
    `${Math.round((weekCompleted / 7) * 100)}%`;
  document.getElementById("daysLeft").textContent =
    `${7 - weekCompleted} day${7 - weekCompleted === 1 ? "" : "s"} remaining`;

  const daysGrid = document.getElementById("daysGrid");
  daysGrid.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = dateKey(d);
    const day = document.createElement("div");
    day.className = "day";
    if (key === todayKey) day.classList.add("today");
    if (progress[key]) day.classList.add("completed");
    day.innerHTML = `
      <div class="name">${new Intl.DateTimeFormat(undefined, {weekday: "short"}).format(d)}</div>
      <div class="num">${d.getDate()}</div>
      <div class="mark">${progress[key] ? "✓" : ""}</div>
    `;
    daysGrid.appendChild(day);
  }

  const weeksList = document.getElementById("weeksList");
  weeksList.innerHTML = "";
  quotes.forEach((item, i) => {
    const ws = new Date(state.start);
    ws.setDate(ws.getDate() + i * 7);
    const completed = Array.from({length: 7}, (_, j) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + j);
      return Boolean(progress[dateKey(d)]);
    }).filter(Boolean).length;

    const row = document.createElement("div");
    row.className = "week-row";
    if (i === state.weekIndex) row.classList.add("current");
    if (i < state.weekIndex) row.classList.add("past");
    row.innerHTML = `
      <div class="week-number">WEEK ${String(i + 1).padStart(2, "0")}</div>
      <div class="week-quote">“${item.quote}”</div>
      <div class="week-count">${completed}/7</div>
    `;
    weeksList.appendChild(row);
  });
}

document.getElementById("completeButton").addEventListener("click", () => {
  const state = getState();
  const key = dateKey(state.today);
  const progress = loadProgress();
  progress[key] = !progress[key];
  saveProgress(progress);
  render();
});

document.getElementById("resetButton").addEventListener("click", () => {
  const ok = confirm("Reset all 13-week progress and start again today?");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(START_KEY, dateKey(new Date()));
  render();
});

render();
