import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/brand/logo";
import { MobileShell } from "@/components/layout/mobile-shell";

export const metadata = {
  title: "Cadastro | Avizme",
};

export default function RegisterPage() {
  return (
    <MobileShell className="justify-center">
      <div className="mb-8 flex w-full justify-center lg:hidden">
        <Logo variant="logotipo" size="xl" />
      </div>
      <RegisterForm />
    </MobileShell>
  );
}
