import { SignupPageView } from "@/components/auth-pages";
import { seededSupabaseDemoPassword } from "@/lib/auth/constants";

export default function SignupPage() {
  return <SignupPageView defaultPassword={seededSupabaseDemoPassword} />;
}
