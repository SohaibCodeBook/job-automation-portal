import { redirect } from "next/navigation";

/** Password reset links from Supabase are obsolete; sign in with Google at /login. */
export default function ResetPasswordPage() {
  redirect("/login");
}
