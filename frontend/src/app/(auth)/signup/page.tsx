import { redirect } from "next/navigation";

/** Account creation is not available with Google-only sign-in; use /login. */
export default function SignupPage() {
  redirect("/login");
}
