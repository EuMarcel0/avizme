import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Entrar | Avizme",
};

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <div className="mb-8 flex w-full justify-center lg:hidden">
        <Logo variant="logotipo" size="xl" />
      </div>
      <LoginForm />
    </AuthSplitLayout>
  );
}
