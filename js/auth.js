// ═══════════════════════════════════════════════════════════
//  AURA · Auth Page Logic
//  Handles: login, signup, Google, Facebook, forgot password
//  Overlay slides LEFT to show signup, RIGHT to show login.
// ═══════════════════════════════════════════════════════════

import {
  loginWithGoogle,
  loginWithFacebook,
  loginWithEmail,
  signupWithEmail,
  resetPassword,
  firebaseReady
} from "./firebase.js";

import { saveUser }            from "./store.js";
import { spawnParticles, toast } from "./ui.js";

// ─── Boot ─────────────────────────────────────────────────
spawnParticles("ptx");

// ─── Element refs ─────────────────────────────────────────
const overlay       = document.getElementById("overlay");
const ovlTitle      = document.getElementById("ovlTitle");
const ovlSub        = document.getElementById("ovlSub");
const ovlToggle     = document.getElementById("ovlToggle");

const loginMsg      = document.getElementById("loginMsg");
const signupMsg     = document.getElementById("signupMsg");
const forgotMsg     = document.getElementById("forgotMsg");

const forgotModalBg = document.getElementById("forgotModalBg");
const forgotEmail   = document.getElementById("forgotEmail");

// ─── State ────────────────────────────────────────────────
let isSignup = false; // false = showing login, true = showing signup

// ═══════════════════════════════════════════════════════════
//  SLIDE ANIMATION
//  Login mode:  overlay on RIGHT  (covers signup panel)
//  Signup mode: overlay on LEFT   (covers login panel)
// ═══════════════════════════════════════════════════════════

function showSignup() {
  isSignup = true;
  // Slide overlay to LEFT → reveals signup panel on the right
  overlay.classList.add("slide-left");

  ovlTitle.innerHTML    = "Welcome<br>Back!";
  ovlSub.innerHTML      = "Already have an account?<br>Sign in and keep writing. 🌊";
  ovlToggle.textContent = "SIGN IN";

  clearMsg(signupMsg);
}

function showLogin() {
  isSignup = false;
  // Slide overlay back to RIGHT → reveals login panel on the left
  overlay.classList.remove("slide-left");

  ovlTitle.innerHTML    = "Hello,<br>Friend!";
  ovlSub.innerHTML      = "Welcome back. Your journal<br>is waiting for you. 🌸";
  ovlToggle.textContent = "SIGN UP";

  clearMsg(loginMsg);
}

ovlToggle.addEventListener("click", () => isSignup ? showLogin() : showSignup());

// ═══════════════════════════════════════════════════════════
//  MESSAGE HELPERS
// ═══════════════════════════════════════════════════════════

function showMsg(el, text, type = "error") {
  el.textContent = text;
  el.className   = "form-msg " + type;
}
function clearMsg(el) {
  el.textContent = "";
  el.className   = "form-msg";
}

function setLoading(btn, on) {
  btn.classList.toggle("loading", on);
  if (on) { btn.dataset.orig = btn.textContent; btn.textContent = "Please wait…"; }
  else    { btn.textContent  = btn.dataset.orig || btn.textContent; }
}

// ═══════════════════════════════════════════════════════════
//  POST-AUTH REDIRECT
// ═══════════════════════════════════════════════════════════

function onAuthSuccess(user) {
  saveUser(user);
  toast("🌸 Welcome to AURA, " + user.name.split(" ")[0] + "!");
  const card = document.getElementById("authCard");
  card.style.transition = "all .5s cubic-bezier(.22,1,.36,1)";
  card.style.transform  = "scale(.92)";
  card.style.opacity    = "0";
  setTimeout(() => { window.location.href = "index.html"; }, 520);
}

// ═══════════════════════════════════════════════════════════
//  GOOGLE
// ═══════════════════════════════════════════════════════════

document.getElementById("gLoginBtn").addEventListener("click", async () => {
  clearMsg(loginMsg);
  try {
    onAuthSuccess(await loginWithGoogle());
  } catch (e) { showMsg(loginMsg, e.message); }
});

document.getElementById("gSignupBtn").addEventListener("click", async () => {
  clearMsg(signupMsg);
  try {
    onAuthSuccess(await loginWithGoogle());
  } catch (e) { showMsg(signupMsg, e.message); }
});

// ═══════════════════════════════════════════════════════════
//  FACEBOOK
// ═══════════════════════════════════════════════════════════

document.getElementById("fbLoginBtn").addEventListener("click", async () => {
  clearMsg(loginMsg);
  try {
    onAuthSuccess(await loginWithFacebook());
  } catch (e) { showMsg(loginMsg, e.message); }
});

document.getElementById("fbSignupBtn").addEventListener("click", async () => {
  clearMsg(signupMsg);
  try {
    onAuthSuccess(await loginWithFacebook());
  } catch (e) { showMsg(signupMsg, e.message); }
});

// ═══════════════════════════════════════════════════════════
//  EMAIL LOGIN
// ═══════════════════════════════════════════════════════════

async function doLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPass").value;
  clearMsg(loginMsg);

  if (!email) { showMsg(loginMsg, "📧 Please enter your email."); return; }
  if (!pass)  { showMsg(loginMsg, "🔒 Please enter your password."); return; }

  const btn = document.getElementById("loginBtn");
  setLoading(btn, true);
  try {
    onAuthSuccess(await loginWithEmail(email, pass));
  } catch (e) {
    setLoading(btn, false);
    showMsg(loginMsg, e.message);
  }
}

document.getElementById("loginBtn").addEventListener("click", doLogin);
document.getElementById("loginPass").addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
});

// ═══════════════════════════════════════════════════════════
//  EMAIL SIGNUP  — blocks duplicate accounts
// ═══════════════════════════════════════════════════════════

async function doSignup() {
  const name  = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const pass  = document.getElementById("signupPass").value;
  clearMsg(signupMsg);

  if (!name)           { showMsg(signupMsg, "👤 What should we call you?"); return; }
  if (!email)          { showMsg(signupMsg, "📧 Please enter your email."); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { showMsg(signupMsg, "📧 Please enter a valid email address."); return; }
  if (pass.length < 6) { showMsg(signupMsg, "🔒 Password must be at least 6 characters."); return; }

  const btn = document.getElementById("signupBtn");
  setLoading(btn, true);
  try {
    onAuthSuccess(await signupWithEmail(name, email, pass));
  } catch (e) {
    setLoading(btn, false);
    // If duplicate email, suggest signing in
    if (e.message.toLowerCase().includes("already")) {
      showMsg(signupMsg, e.message + " Click SIGN IN to switch.");
    } else {
      showMsg(signupMsg, e.message);
    }
  }
}

document.getElementById("signupBtn").addEventListener("click", doSignup);
document.getElementById("signupPass").addEventListener("keydown", e => {
  if (e.key === "Enter") doSignup();
});

// ═══════════════════════════════════════════════════════════
//  FORGOT PASSWORD MODAL
// ═══════════════════════════════════════════════════════════

function openForgotModal() {
  forgotEmail.value = document.getElementById("loginEmail").value; // pre-fill
  clearMsg(forgotMsg);
  forgotModalBg.classList.add("open");
  setTimeout(() => forgotEmail.focus(), 350);
}

function closeForgotModal() {
  forgotModalBg.classList.remove("open");
}

document.getElementById("forgotLink").addEventListener("click",      openForgotModal);
document.getElementById("forgotCloseBtn").addEventListener("click",  closeForgotModal);

// Close on backdrop click
forgotModalBg.addEventListener("click", e => {
  if (e.target === forgotModalBg) closeForgotModal();
});

// Send reset email
async function doReset() {
  const email = forgotEmail.value.trim();
  clearMsg(forgotMsg);

  if (!email) { showMsg(forgotMsg, "📧 Please enter your email address."); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { showMsg(forgotMsg, "📧 Please enter a valid email address."); return; }

  const btn = document.getElementById("forgotSendBtn");
  setLoading(btn, true);

  try {
    await resetPassword(email);
    setLoading(btn, false);

    if (firebaseReady) {
      showMsg(forgotMsg,
        "✅ Reset link sent! Check your inbox (and spam folder).",
        "success"
      );
    } else {
      showMsg(forgotMsg,
        "✅ (Demo mode) In production, a reset email would be sent to " + email,
        "success"
      );
    }

    // Auto-close after 3s on success
    setTimeout(() => {
      closeForgotModal();
      // Pre-fill the email field for convenience
      document.getElementById("loginEmail").value = email;
    }, 3200);

  } catch (e) {
    setLoading(btn, false);
    showMsg(forgotMsg, e.message);
  }
}

document.getElementById("forgotSendBtn").addEventListener("click", doReset);
forgotEmail.addEventListener("keydown", e => {
  if (e.key === "Enter") doReset();
});

// ─── Demo mode banner ─────────────────────────────────────
if (!firebaseReady) {
  const banner = document.createElement("div");
  banner.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;
    background:var(--grad);color:#fff;
    text-align:center;padding:10px 20px;
    font-size:.78rem;font-weight:700;z-index:9999;
    letter-spacing:.3px;
  `;
  banner.innerHTML = "⚡ Demo Mode — Add your Firebase config to <code style='background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px'>js/firebase.js</code> to enable real authentication";
  document.body.appendChild(banner);
}
