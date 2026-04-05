// ═══════════════════════════════════════════════════════════
//  AURA · Firebase Configuration
//  Replace firebaseConfig below with your actual values.
//  Get from: console.firebase.google.com
//  Project Settings → General → Your apps → Web app → Config
// ═══════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── PASTE YOUR CONFIG HERE ───────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyA_HMMKQYrEikc4Ig8SXw87ROytzFYStP0",
    authDomain: "aura-67702.firebaseapp.com",
    projectId: "aura-67702",
    storageBucket: "aura-67702.firebasestorage.app",
    messagingSenderId: "652337209232",
    appId: "1:652337209232:web:a580f4dd0c2619d112dd15",
    measurementId: "G-1D2089T4Y8"
};
// ─────────────────────────────────────────────────────────

let auth = null;
let googleProvider = null;
let facebookProvider = null;
export let firebaseReady = false;

try {
    if (!firebaseConfig.apiKey.startsWith("YOUR_")) {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        facebookProvider = new FacebookAuthProvider();
        firebaseReady = true;

        // Auto-redirect if already logged in
        onAuthStateChanged(auth, (user) => {
            if (user && window.location.pathname.includes("auth.html")) {
                window.location.href = "index.html";
            }
        });
    } else {
        console.info("[AURA] Demo mode — add your Firebase config to js/firebase.js to enable real auth.");
    }
} catch (err) {
    console.warn("[AURA] Firebase init failed:", err.message);
}

// ─── Human-readable error messages ───────────────────────
function friendlyMsg(code) {
    const map = {
        "auth/user-not-found": "No account found with that email. Want to sign up?",
        "auth/wrong-password": "Incorrect password. Try again or use Forgot Password.",
        "auth/email-already-in-use": "This email already has an account. Try signing in instead.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/too-many-requests": "Too many failed attempts. Wait a moment and try again.",
        "auth/popup-closed-by-user": "The sign-in window was closed. Please try again.",
        "auth/cancelled-popup-request": "Only one sign-in window at a time — please try again.",
        "auth/account-exists-with-different-credential": "This email is already linked to a different sign-in method.",
        "auth/network-request-failed": "Network error — check your internet connection.",
        "auth/internal-error": "Firebase is not fully configured yet. Check js/firebase.js.",
        "auth/invalid-api-key": "Invalid Firebase API key. Update the config in js/firebase.js.",
        "auth/app-not-authorized": "This domain is not authorized. Add it in Firebase → Authentication → Authorized domains.",
        "auth/invalid-credential": "Invalid credentials. Check your email and password.",
    };
    return map[code] || "Something went wrong. Please try again.";
}

// ─── Demo fallback ────────────────────────────────────────
function demoUser(name, email) {
    return { uid: "demo_" + Date.now(), name, email, photo: null };
}

// ═══ Exported Auth Methods ════════════════════════════════

export async function loginWithGoogle() {
    if (!firebaseReady) return demoUser("Google Demo", "google@demo.aura");
    try {
        const r = await signInWithPopup(auth, googleProvider);
        return { uid: r.user.uid, name: r.user.displayName || r.user.email.split("@")[0], email: r.user.email, photo: r.user.photoURL };
    } catch (e) { throw new Error(friendlyMsg(e.code)); }
}

export async function loginWithFacebook() {
    if (!firebaseReady) return demoUser("Facebook Demo", "fb@demo.aura");
    try {
        const r = await signInWithPopup(auth, facebookProvider);
        return { uid: r.user.uid, name: r.user.displayName || r.user.email.split("@")[0], email: r.user.email, photo: r.user.photoURL };
    } catch (e) { throw new Error(friendlyMsg(e.code)); }
}

export async function loginWithEmail(email, password) {
    if (!firebaseReady) return demoUser(email.split("@")[0], email);
    try {
        const r = await signInWithEmailAndPassword(auth, email, password);
        return { uid: r.user.uid, name: r.user.displayName || email.split("@")[0], email: r.user.email, photo: r.user.photoURL };
    } catch (e) { throw new Error(friendlyMsg(e.code)); }
}

export async function signupWithEmail(name, email, password) {
    if (!firebaseReady) return demoUser(name, email);
    try {
        // ── Block duplicate accounts ──────────────────────────
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
            throw new Error("This email already has an AURA account. Try signing in instead.");
        }
        const r = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(r.user, { displayName: name });
        return { uid: r.user.uid, name, email: r.user.email, photo: null };
    } catch (e) {
        if (e.message && !e.code) throw e; // already friendly
        throw new Error(friendlyMsg(e.code));
    }
}

export async function resetPassword(email) {
    if (!firebaseReady) {
        // Demo — simulate success
        return true;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (e) { throw new Error(friendlyMsg(e.code)); }
}

export async function logoutUser() {
    if (auth) await signOut(auth);
}