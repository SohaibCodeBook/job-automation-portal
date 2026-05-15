import { redirect } from "next/navigation";

/** Password reset via Supabase has been removed; sign in with Google at /login. */
export default function ForgotPasswordPage() {
  redirect("/login");
}
