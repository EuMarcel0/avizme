export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-y-auto overscroll-y-contain">
      {children}
    </div>
  );
}
