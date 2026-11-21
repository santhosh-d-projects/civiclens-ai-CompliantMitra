// Optional Firebase email verification (citizen onboarding add-on).
// Primary auth is Supabase email + password — Firebase is used ONLY to send
// an extra verification email when a new citizen opts in at registration.
// Fully env-gated: without NEXT_PUBLIC_FIREBASE_* config the option is hidden
// and the main login/registration flow is completely unchanged.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseEnabled = () => Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);

let app: FirebaseApp | null = null;
export async function sendFirebaseEmailVerification(email: string, password: string): Promise<"sent" | "skipped" | "failed"> {
  if (!firebaseEnabled()) return "skipped";
  try {
    app ??= getApps().length ? getApps()[0]! : initializeApp(cfg as Record<string, string>);
    const auth = getAuth(app);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await signOut(auth).catch(() => {});
    return "sent";
  } catch {
    return "failed";
  }
}
