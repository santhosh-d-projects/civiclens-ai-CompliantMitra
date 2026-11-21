"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function SignOut() {
  return <button className="text-sm font-medium text-slate-500 hover:text-red-600" onClick={async () => { await supabaseBrowser().auth.signOut(); window.location.href = "/"; }}>Sign out</button>;
}
