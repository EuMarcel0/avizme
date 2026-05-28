import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Cadastro | Avizme",
};

export default function RegisterPage() {
  return (
    <AuthSplitLayout>
      <div className="mb-8 flex w-full justify-center lg:hidden">
        <Logo variant="logotipo" size="xl" />
      </div>
      <RegisterForm />
    </AuthSplitLayout>
  );
}
