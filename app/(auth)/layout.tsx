import { Suspense } from "react";

import { AuthOAuthErrorHandler } from "@/components/auth/auth-oauth-error-handler";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-y-auto overscroll-y-contain">
      <Suspense fallback={null}>
        <AuthOAuthErrorHandler />
      </Suspense>
      {children}
    </div>
  );
}
