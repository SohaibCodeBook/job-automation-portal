import { redirect } from "next/navigation";

/** Legacy URL: account creation uses Google OAuth on /login ("Create New Account"). */
export default function SignupPage() {
  redirect("/login");
}
