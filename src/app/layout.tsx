import "./globals.css";
import type { ReactNode } from "react";
export const metadata = { title: "Complaint Sathi — Bengaluru Civic Complaints", description: "AI suggests, you confirm. Citizen complaints classified, prioritised and routed to the right department." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
