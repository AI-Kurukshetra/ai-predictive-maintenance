import { LoginPageView } from "@/components/auth-pages";
import { seededSupabaseDemoPassword } from "@/lib/auth/constants";
import { hasSupabaseEnv } from "@/lib/config";

export default function LoginPage() {
  return (
    <LoginPageView
      authMode={hasSupabaseEnv() ? "supabase" : "demo"}
      defaultPassword={seededSupabaseDemoPassword}
    />
  );
}
