"use client";

import { Form, Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ButtonLabelSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { syncUserOnClient } from "@/lib/users/client-sync";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

const initialValues: LoginValues = {
  email: "",
  password: ""
};

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <Card className="border-border/80 bg-white shadow-sm dark:border-border dark:bg-card">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse seus lembretes por SMS, WhatsApp ou e-mail.</CardDescription>
      </CardHeader>
      <Formik
        initialValues={initialValues}
        validationSchema={loginSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password
          });
          setSubmitting(false);
          if (error) {
            toast.error(error.message);
            return;
          }
          try {
            await syncUserOnClient();
          } catch {
            toast.error("Login ok, mas falhou ao sincronizar perfil no banco.");
            return;
          }
          toast.success("Bem-vindo de volta!");
          router.push("/app");
          router.refresh();
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
          <Form className='flex flex-col'>
            <CardContent className='space-y-4'>
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
                id="password"
                label="Senha"
                error={errors.password}
                showError={!!(touched.password && errors.password)}
              >
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="********"
                  aria-invalid={!!(touched.password && errors.password)}
                />
              </FormField>
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? (
                  <ButtonLabelSkeleton className="w-20" />
                ) : (
                  "Entrar"
                )}
              </Button>
              <div className='relative'>
                <Separator />
                <span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground dark:bg-card'>
                  ou
                </span>
              </div>
              <GoogleSignInButton />
            </CardContent>
            <CardFooter className='mt-8 justify-center border-t border-border/60 bg-white py-5 text-sm text-muted-foreground dark:bg-muted/50'>
              Não tem conta?{" "}
              <Link href='/cadastro' className='ml-1 font-medium text-primary underline-offset-4 hover:underline'>
                Cadastre-se
              </Link>
            </CardFooter>
          </Form>
        )}
      </Formik>
    </Card>
  );
}
