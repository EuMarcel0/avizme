"use client";

import { Form, Formik } from "formik";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { syncUserOnClient } from "@/lib/users/client-sync";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";

const initialValues: RegisterValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: ""
};

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      toast.error(error.message);
    }
  }

  return (
    <Card className='border-border/80 shadow-sm'>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Cadastro rápido para começar a agendar lembretes.</CardDescription>
      </CardHeader>
      <Formik
        initialValues={initialValues}
        validationSchema={registerSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const { data, error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: {
                full_name: values.fullName,
                phone: values.phone
                  ? values.phone.replace(/\D/g, "")
                  : null,
              }
            }
          });
          setSubmitting(false);
          if (error) {
            toast.error(error.message);
            return;
          }
          if (data.user && !data.session) {
            toast.success("Verifique seu e-mail para confirmar o cadastro. Seu perfil será criado ao confirmar.");
            router.push("/login");
            return;
          }
          try {
            await syncUserOnClient();
          } catch {
            toast.error("Conta criada, mas falhou ao salvar no banco. Tente entrar novamente.");
            return;
          }
          toast.success("Conta criada com sucesso!");
          router.push("/app");
          router.refresh();
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue,
          setFieldTouched,
          isSubmitting,
        }) => (
          <Form className='flex flex-col'>
            <CardContent className='space-y-4'>
              <FormField
                id="fullName"
                label="Nome completo"
                error={errors.fullName}
                showError={!!(touched.fullName && errors.fullName)}
              >
                <Input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={values.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={!!(touched.fullName && errors.fullName)}
                />
              </FormField>
              <FormField
                id="email"
                label="E-mail"
                error={errors.email}
                showError={!!(touched.email && errors.email)}
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={!!(touched.email && errors.email)}
                />
              </FormField>
              <FormField
                id="phone"
                label="Telefone (opcional)"
                error={errors.phone}
                showError={!!(touched.phone && errors.phone)}
              >
                <PhoneInput
                  id="phone"
                  name="phone"
                  value={values.phone ?? ""}
                  onAccept={(value) => setFieldValue("phone", value)}
                  onBlur={() => setFieldTouched("phone", true)}
                  aria-invalid={!!(touched.phone && errors.phone)}
                />
              </FormField>
              <FormField
                id="password"
                label="Senha"
                error={errors.password}
                showError={!!(touched.password && errors.password)}
              >
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="********"
                  aria-invalid={!!(touched.password && errors.password)}
                />
              </FormField>
              <FormField
                id="confirmPassword"
                label="Confirmar senha"
                error={errors.confirmPassword}
                showError={!!(touched.confirmPassword && errors.confirmPassword)}
              >
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="********"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={
                    !!(touched.confirmPassword && errors.confirmPassword)
                  }
                />
              </FormField>
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='animate-spin' />
                    Criando conta…
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
              <div className='relative'>
                <Separator />
                <span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground'>
                  ou
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogle}
              >
                <FcGoogle className="size-5 shrink-0" aria-hidden />
                Continuar com Google
              </Button>
            </CardContent>
            <CardFooter className='mt-8 justify-center border-t border-border/60 py-5 text-sm text-muted-foreground'>
              Já tem conta?{" "}
              <Link href='/login' className='ml-1 font-medium text-primary underline-offset-4 hover:underline'>
                Entrar
              </Link>
            </CardFooter>
          </Form>
        )}
      </Formik>
    </Card>
  );
}
