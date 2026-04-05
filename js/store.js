// ═══════════════════════════════════════════════════════════
//  AURA · Global Store
//  Central state management — entries, user, preferences
// ═══════════════════════════════════════════════════════════

const KEYS = {
  ENTRIES:  "aura_entries_v3",
  USER:     "aura_user_v1",
  PREFS:    "aura_prefs_v1",
};

// ─── User ─────────────────────────────────────────────────

export function saveUser(user) {
  try { localStorage.setItem(KEYS.USER, JSON.stringify(user)); } catch (_) {}
  window.AURA_USER = user;
}

export function loadUser() {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    window.AURA_USER = raw ? JSON.parse(raw) : null;
  } catch (_) { window.AURA_USER = null; }
  return window.AURA_USER;
}

export function clearUser() {
  localStorage.removeItem(KEYS.USER);
  window.AURA_USER = null;
}

// ─── Entries ──────────────────────────────────────────────

export function getEntries() {
  try {
    const raw = localStorage.getItem(KEYS.ENTRIES);
    return raw ? JSON.parse(raw) : _seedEntries();
  } catch (_) { return _seedEntries(); }
}

export function saveEntry(entry) {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === entry.id);
  if (idx > -1) entries[idx] = entry;
  else entries.unshift(entry);
  _persist(entries);
  return entries;
}

export function deleteEntry(id) {
  const entries = getEntries().filter(e => e.id !== id);
  _persist(entries);
  return entries;
}

export function clearAllEntries() {
  localStorage.removeItem(KEYS.ENTRIES);
}

function _persist(entries) {
  try { localStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries)); } catch (_) {}
}

// ─── Prefs ────────────────────────────────────────────────

export function getPrefs() {
  const defaults = { particles: true, wordCount: true, prompts: false, reminder: true };
  try {
    const raw = localStorage.getItem(KEYS.PREFS);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch (_) { return defaults; }
}

export function savePref(key, val) {
  const prefs = getPrefs();
  prefs[key] = val;
  try { localStorage.setItem(KEYS.PREFS, JSON.stringify(prefs)); } catch (_) {}
}

// ─── Stats ────────────────────────────────────────────────

export function computeStats(entries) {
  const totalWords = entries.reduce((sum, e) => {
    return sum + (e.body ? e.body.trim().split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  // Streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (entries.find(e => e.date === ds)) streak++;
    else break;
  }

  // Top mood
  const moodCount = {};
  entries.forEach(e => { moodCount[e.mood] = (moodCount[e.mood] || 0) + 1; });
  const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0];

  return {
    entries:  entries.length,
    words:    totalWords,
    streak,
    topMood:  topMood ? topMood[0] : "—",
  };
}

// ─── Seed Data ────────────────────────────────────────────

function _seedEntries() {
  return [
    {
      id: 1001,
      title: "A Fresh Start in April",
      body: "Today felt like a reset button. The morning air was crisp and the sky had that perfect April blue — the kind that makes you feel like anything is possible. I sat with my chai for twenty full minutes and just watched the world wake up. No phone. No noise. Just me and the morning.",
      mood: "😊", date: "2026-04-01", time: "08:22",
      tags: ["Personal", "Gratitude"], wx: "☀️ Sunny"
    },
    {
      id: 1002,
      title: "Chasing Deadlines",
      body: "Work has been relentless this week. Deadlines stacked on deadlines. But I managed to carve out 20 minutes to just sit with my coffee and breathe. That small act felt revolutionary. There's something about intentional stillness that resets everything.",
      mood: "🔥", date: "2026-03-30", time: "23:45",
      tags: ["Work"], wx: "🌧 Rainy"
    },
    {
      id: 1003,
      title: "A Quiet Sunday",
      body: "Nothing happened today and somehow that was the best thing. I read, napped, and made pasta from scratch. The kind of Sunday I want to bottle up and save for the grey Mondays. The house smelled like garlic and olive oil. That's happiness.",
      mood: "😌", date: "2026-03-29", time: "19:15",
      tags: ["Personal"], wx: "☀️ Sunny"
    },
    {
      id: 1004,
      title: "Missing the Rain",
      body: "It rained in the morning and I stood by the window for a long time. Some memories are shaped like weather — they arrive unannounced and leave quietly, but they change the air of everything. Felt far away today. Not sad, just... distant.",
      mood: "🌧", date: "2026-03-28", time: "09:40",
      tags: ["Dreams"], wx: "🌧 Rainy"
    },
    {
      id: 1005,
      title: "Three Things I'm Grateful For",
      body: "1. The call from mom that lasted an hour and felt like five minutes.\n2. The way sunlight hit my desk at exactly 4pm and made everything golden.\n3. Finding that old playlist I thought I had deleted. Some songs are time machines.\n\nSmall things. Big feelings.",
      mood: "😊", date: "2026-03-27", time: "22:00",
      tags: ["Gratitude"], wx: "🌤 Cloudy"
    },
    {
      id: 1006,
      title: "Ideas at 2am",
      body: "Couldn't sleep. Opened the notes app and let it all out. The project idea feels real now — more real than anything I've thought of in months. There's this quiet electricity when something clicks. I want to chase that feeling wherever it goes.",
      mood: "🤩", date: "2026-03-26", time: "02:17",
      tags: ["Goals"], wx: "☀️ Sunny"
    },
  ];
}
