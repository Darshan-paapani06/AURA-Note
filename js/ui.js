// ═══════════════════════════════════════════════════════════
//  AURA · UI Utilities
//  Shared helpers used across all pages
// ═══════════════════════════════════════════════════════════

// ─── Toast ────────────────────────────────────────────────
let _toastTimer;
export function toast(msg) {
  let el = document.getElementById("aura-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "aura-toast";
    el.className = "aura-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

// ─── Particles ────────────────────────────────────────────
export function spawnParticles(containerId = "ptx") {
  const c = document.getElementById(containerId);
  if (!c) return;
  const cols = ["#3ecfdf", "#1a9fb8", "#5ad8e8", "#1488CC", "#a8dff0"];
  for (let i = 0; i < 24; i++) {
    const d = document.createElement("div");
    d.className = "pt";
    const s = 14 + Math.random() * 56;
    d.style.cssText = `
      width:${s}px;height:${s}px;
      left:${Math.random() * 100}%;
      background:${cols[0 | (Math.random() * cols.length)]};
      animation-duration:${9 + Math.random() * 14}s;
      animation-delay:${Math.random() * 14}s;
    `;
    c.appendChild(d);
  }
}

// ─── Ripple ───────────────────────────────────────────────
export function addRipple(btn) {
  btn.addEventListener("click", function (e) {
    const r = document.createElement("span");
    r.className = "ripple";
    const rect = btn.getBoundingClientRect();
    const sz = Math.max(rect.width, rect.height);
    r.style.cssText = `
      width:${sz}px;height:${sz}px;
      left:${e.clientX - rect.left - sz / 2}px;
      top:${e.clientY - rect.top - sz / 2}px;
    `;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 700);
  });
}

// ─── Date helpers ─────────────────────────────────────────
export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(ds) {
  if (!ds) return "";
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime() {
  return new Date().toLocaleTimeString("en", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function greeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const em = ["✨", "🌸", "💙", "🌊", "🎯", "🌿"][0 | (Math.random() * 6)];
  return `${g}, ${name} ${em}`;
}

// ─── Avatar ───────────────────────────────────────────────
export function setAvatar(el, user) {
  if (!el || !user) return;
  if (user.photo) {
    el.innerHTML = `<img src="${user.photo}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  } else {
    el.textContent = (user.name || "A")[0].toUpperCase();
  }
}

// ─── Word count ───────────────────────────────────────────
export function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Writing prompts ──────────────────────────────────────
export const PROMPTS = [
  "What made you smile today, even briefly?",
  "Describe today using only colors and textures.",
  "What would you tell your past self from a year ago?",
  "What is one thing April has taught you so far?",
  "Write about a sound you heard today you want to remember.",
  "What are you quietly proud of this week?",
  "If today were a chapter title, what would it be?",
  "What small thing brought unexpected joy?",
  "Who are you slowly becoming?",
  "What do you need to let go of right now?",
  "Write a letter to the person you want to be.",
  "What made this ordinary day extraordinary?",
];

export function randomPrompt() {
  return PROMPTS[0 | (Math.random() * PROMPTS.length)];
}
