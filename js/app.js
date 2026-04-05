// ═══════════════════════════════════════════════════════════
//  AURA · App Logic  (index.html)
//  Home · Calendar · Mood · Search · Settings · Editor
// ═══════════════════════════════════════════════════════════

import { logoutUser }                            from "./firebase.js";
import { loadUser, clearUser, getEntries, saveEntry, deleteEntry, clearAllEntries, computeStats, getPrefs, savePref } from "./store.js";
import { spawnParticles, toast, setAvatar, formatDate, todayISO, formatTime, greeting, wordCount, randomPrompt } from "./ui.js";

// ─── Auth guard ───────────────────────────────────────────
const user = loadUser();
if (!user) { window.location.href = "auth.html"; }

// ─── Init ─────────────────────────────────────────────────
const prefs = getPrefs();
if (prefs.particles) spawnParticles("ptx");

// Populate user info everywhere
setAvatar(document.getElementById("topAv"),       user);
setAvatar(document.getElementById("profileAv"),   user);
setAvatar(document.getElementById("profileAvLg"), user);
document.getElementById("topName").textContent       = user.name.split(" ")[0];
document.getElementById("profileName").textContent   = user.name;
document.getElementById("profileEmail").textContent  = user.email;
document.getElementById("dispNameInp").value         = user.name;
document.getElementById("ctaGreeting").textContent   = greeting(user.name.split(" ")[0]);

// Apply prefs toggles
document.getElementById("togParticles").checked = prefs.particles;
document.getElementById("togWordCount").checked  = prefs.wordCount;
document.getElementById("togPrompts").checked    = prefs.prompts;
document.getElementById("togReminder").checked   = prefs.reminder;

// ─── Tab system ───────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.getElementById("tab-" + name).classList.add("active");
  if (name === "calendar") renderCalendar();
  if (name === "mood")     renderMoodTracker();
  if (name === "search")   renderSearch(document.getElementById("searchInp").value);
}
document.querySelectorAll("[data-tab]").forEach(b => {
  b.addEventListener("click", () => switchTab(b.dataset.tab));
});

// ─── Home ─────────────────────────────────────────────────
let homeFilter = "all";

function renderHome(filter) {
  if (filter !== undefined) homeFilter = filter;
  const entries  = getEntries();
  const filtered = homeFilter === "all" ? entries : entries.filter(e => e.mood === homeFilter);
  renderStats(entries);
  renderCards(filtered, document.getElementById("homeEntries"));
}

document.getElementById("filterStrip").addEventListener("click", e => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
  renderHome(btn.dataset.f);
});

document.getElementById("ctaBanner").addEventListener("click",    () => openEditor());
document.getElementById("newEntryBtn").addEventListener("click",   () => openEditor());
document.getElementById("newEntryTopBtn").addEventListener("click",() => openEditor());

// ─── Stats ────────────────────────────────────────────────
function renderStats(entries) {
  const s = computeStats(entries);
  document.getElementById("statEntries").textContent = s.entries;
  document.getElementById("statWords").textContent   = s.words >= 1000 ? (s.words / 1000).toFixed(1) + "k" : s.words;
  document.getElementById("statStreak").textContent  = s.streak;
  document.getElementById("statMoodIcon").textContent = s.topMood;
  document.getElementById("statMoodLbl").textContent  = s.entries ? "Top Mood" : "—";
}

// ─── Entry Cards ──────────────────────────────────────────
function makeCard(entry, delay = 0) {
  const card = document.createElement("div");
  card.className = "entry-card";
  card.style.animationDelay = delay * .065 + "s";
  card.innerHTML = `
    <div class="ec-stripe"></div>
    <div class="ec-date">📅 ${formatDate(entry.date)} · ${entry.time}</div>
    <div class="ec-title">${entry.title}</div>
    <div class="ec-preview">${entry.body}</div>
    <div class="ec-foot">
      <span class="ec-mood">${entry.mood}</span>
      <div class="ec-tags">${(entry.tags || []).map(t => `<span class="ec-tag">${t}</span>`).join("")}</div>
    </div>`;
  card.addEventListener("click", () => openEditor(entry));
  return card;
}

function renderCards(entries, container) {
  container.innerHTML = "";
  if (!entries.length) {
    container.innerHTML = `<div class="empty-state"><div class="big">✍️</div><p>No entries here yet.<br>Start writing your story.</p></div>`;
    return;
  }
  entries.forEach((e, i) => container.appendChild(makeCard(e, i)));
}

// ─── Calendar ─────────────────────────────────────────────
let calY = new Date().getFullYear();
let calM = new Date().getMonth();
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function renderCalendar() {
  document.getElementById("calTitle").textContent = `${MONTHS[calM]} ${calY}`;
  const grid    = document.getElementById("calGrid");
  const entries = getEntries();
  const today   = new Date();
  grid.innerHTML = "";

  // Day names
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
    const el = document.createElement("div");
    el.className = "cal-dname"; el.textContent = d; grid.appendChild(el);
  });

  const firstDay = new Date(calY, calM, 1).getDay();
  const daysInMonth = new Date(calY, calM + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement("button"); el.className = "cal-day empty"; grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const ds  = `${calY}-${String(calM + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const has = entries.find(e => e.date === ds);
    const el  = document.createElement("button");
    el.className = "cal-day";
    el.textContent = d;
    if (has) el.classList.add("has-entry");
    if (d === today.getDate() && calM === today.getMonth() && calY === today.getFullYear())
      el.classList.add("today");
    el.addEventListener("click", () => {
      if (has) showDayEntries(ds);
      else     openEditor(null, ds);
    });
    grid.appendChild(el);
  }
}

function showDayEntries(ds) {
  const area    = document.getElementById("calDayEntries");
  const entries = getEntries().filter(e => e.date === ds);
  area.innerHTML = entries.length
    ? `<div class="sec-title" style="margin-top:24px">Entries for ${formatDate(ds)}</div><div class="entries-grid" id="calEntryCards"></div>`
    : "";
  if (entries.length) {
    const g = document.getElementById("calEntryCards");
    entries.forEach((e, i) => g.appendChild(makeCard(e, i)));
  }
}

document.getElementById("calPrev").addEventListener("click", () => {
  calM--; if (calM < 0) { calM = 11; calY--; } renderCalendar();
});
document.getElementById("calNext").addEventListener("click", () => {
  calM++; if (calM > 11) { calM = 0; calY++; } renderCalendar();
});

// ─── Mood Tracker ─────────────────────────────────────────
const MOODS = ["😊","😌","🔥","🌧","😴","🤩"];

function renderMoodTracker() {
  const entries = getEntries();
  const counts  = {};
  MOODS.forEach(m => { counts[m] = entries.filter(e => e.mood === m).length; });
  const max = Math.max(...Object.values(counts), 1);

  document.getElementById("moodBars").innerHTML = MOODS.map(m => `
    <div class="bar-row">
      <span class="bar-emoji">${m}</span>
      <div class="bar-wrap"><div class="bar-fill" style="width:${(counts[m]/max*100).toFixed(1)}%"></div></div>
      <span class="bar-count">${counts[m]}</span>
    </div>`).join("");

  const recent = entries.slice(0, 7);
  document.getElementById("moodLog").innerHTML = recent.length
    ? recent.map(e => `
      <div class="log-item">
        <span class="log-emoji">${e.mood}</span>
        <div><div class="log-title">${e.title}</div><div class="log-date">${formatDate(e.date)}</div></div>
      </div>`).join("")
    : `<div style="color:var(--muted);font-size:.85rem;padding:10px 0">No entries yet.</div>`;
}

window.quickMood = function(m) {
  openEditor(null, null, m);
  toast(`${m} Opening editor…`);
};

// ─── Search ───────────────────────────────────────────────
function renderSearch(q) {
  const entries  = getEntries();
  const filtered = q.trim()
    ? entries.filter(e =>
        [e.title, e.body, e.mood, ...(e.tags || [])].join(" ").toLowerCase().includes(q.toLowerCase()))
    : entries;
  const container = document.getElementById("searchResults");
  const empty     = document.getElementById("searchEmpty");
  container.innerHTML = "";
  empty.classList.toggle("hidden", filtered.length > 0);
  filtered.forEach((e, i) => container.appendChild(makeCard(e, i)));
}

document.getElementById("searchInp").addEventListener("input", function () {
  renderSearch(this.value);
});

// ─── Settings ─────────────────────────────────────────────
// Pref toggles
["Particles","WordCount","Prompts","Reminder"].forEach(key => {
  document.getElementById("tog" + key).addEventListener("change", function () {
    savePref(key.toLowerCase(), this.checked);
    if (key === "Particles") {
      document.getElementById("ptx").style.display = this.checked ? "" : "none";
    }
  });
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const data = JSON.stringify(getEntries(), null, 2);
  const a = document.createElement("a");
  a.href = "data:application/json;charset=utf-8," + encodeURIComponent(data);
  a.download = "aura_journal_export.json";
  a.click();
  toast("📦 Entries exported!");
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("Clear ALL entries? This cannot be undone.")) return;
  clearAllEntries();
  renderHome(); renderCalendar(); renderMoodTracker(); renderSearch("");
  toast("🗑️ All entries cleared.");
});

document.getElementById("signOutBtn").addEventListener("click", async () => {
  try {
    await logoutUser();
  } catch (_) {}
  clearUser();
  window.location.href = "auth.html";
});

// ─── Editor ───────────────────────────────────────────────
let editingEntry = null;
let edMood = "😊";
let edTags = ["Personal"];
let edWx   = "☀️ Sunny";

function openEditor(entry = null, forceDate = null, forceMood = null) {
  editingEntry = entry;
  edMood = entry?.mood || forceMood || "😊";
  edTags = entry ? [...(entry.tags || [])] : ["Personal"];
  edWx   = entry?.wx || "☀️ Sunny";

  const now = new Date();
  const day = entry ? new Date(entry.date + "T00:00:00") : (forceDate ? new Date(forceDate + "T00:00:00") : now);

  document.getElementById("edDay").textContent    = String(day.getDate()).padStart(2, "0");
  document.getElementById("edMonthLbl").textContent = day.toLocaleString("en", { month: "long" }).toUpperCase() + " " + day.getFullYear();
  document.getElementById("edModalTitle").textContent = entry ? "Edit Entry" : "New Entry · " + now.toLocaleDateString("en", { day: "numeric", month: "short" });
  document.getElementById("edEntryTitle").value = entry?.title || "";
  document.getElementById("edEntryBody").value  = entry?.body  || "";
  updateWordCount();

  // Sync UI
  document.querySelectorAll("#moodPicker .mp").forEach(b => b.classList.toggle("sel", b.dataset.m === edMood));
  document.querySelectorAll("#tagChips .chip").forEach(c => c.classList.toggle("sel", edTags.includes(c.dataset.t)));
  document.querySelectorAll("#wxChips .chip").forEach(c => c.classList.toggle("sel", c.dataset.t === edWx));

  document.getElementById("editorModal").classList.add("open");
  setTimeout(() => document.getElementById("edEntryTitle").focus(), 380);
}

function closeEditor() {
  document.getElementById("editorModal").classList.remove("open");
}

document.getElementById("editorModal").addEventListener("click", function (e) {
  if (e.target === this) closeEditor();
});
document.getElementById("edCloseBtn").addEventListener("click", closeEditor);

// Mood
document.getElementById("moodPicker").addEventListener("click", e => {
  const btn = e.target.closest(".mp"); if (!btn) return;
  document.querySelectorAll("#moodPicker .mp").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel"); edMood = btn.dataset.m;
});

// Tags
document.getElementById("tagChips").addEventListener("click", e => {
  const c = e.target.closest(".chip"); if (!c) return;
  c.classList.toggle("sel");
  edTags = [...document.querySelectorAll("#tagChips .chip.sel")].map(x => x.dataset.t);
});

// Weather
document.getElementById("wxChips").addEventListener("click", e => {
  const c = e.target.closest(".chip"); if (!c) return;
  document.querySelectorAll("#wxChips .chip").forEach(x => x.classList.remove("sel"));
  c.classList.add("sel"); edWx = c.dataset.t;
});

// Toolbar
window.tbFmt   = (cmd) => document.execCommand(cmd);
window.tbInsert = (txt) => {
  const ta = document.getElementById("edEntryBody");
  const s  = ta.selectionStart, end = ta.selectionEnd;
  ta.value = ta.value.slice(0, s) + txt + ta.value.slice(end);
  ta.selectionStart = ta.selectionEnd = s + txt.length;
  ta.focus(); updateWordCount();
};

document.getElementById("edEntryBody").addEventListener("input", updateWordCount);

function updateWordCount() {
  const w = wordCount(document.getElementById("edEntryBody").value);
  document.getElementById("wordCount").textContent = w + " word" + (w !== 1 ? "s" : "");
}

document.getElementById("promptBtn").addEventListener("click", () => {
  const ta = document.getElementById("edEntryBody");
  if (ta.value && !ta.value.endsWith("\n")) ta.value += "\n\n";
  ta.value += `💡 ${randomPrompt()}\n`;
  updateWordCount(); ta.focus();
});

// Save
document.getElementById("saveEntryBtn").addEventListener("click", () => {
  const title = document.getElementById("edEntryTitle").value.trim() || "Untitled Entry";
  const body  = document.getElementById("edEntryBody").value.trim();
  if (!body) { toast("✏️ Write something first!"); return; }

  const entry = {
    id:    editingEntry?.id || Date.now(),
    title, body,
    mood:  edMood,
    date:  editingEntry?.date || todayISO(),
    time:  formatTime(),
    tags:  [...edTags],
    wx:    edWx,
  };

  saveEntry(entry);
  renderHome();
  renderCalendar();
  renderMoodTracker();
  renderSearch(document.getElementById("searchInp").value);
  closeEditor();
  toast(editingEntry ? "✏️ Entry updated!" : "🌸 Entry saved! Keep writing.");
});

// Delete from editor
document.getElementById("deleteEntryBtn").addEventListener("click", () => {
  if (!editingEntry) return;
  if (!confirm("Delete this entry?")) return;
  deleteEntry(editingEntry.id);
  renderHome(); renderCalendar(); renderMoodTracker();
  closeEditor();
  toast("🗑️ Entry deleted.");
});

// ─── First render ─────────────────────────────────────────
renderHome();
