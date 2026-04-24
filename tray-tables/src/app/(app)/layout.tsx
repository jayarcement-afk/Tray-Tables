import { AppHeader } from "@/components/shell/app-header";

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppHeader />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </>
  );
}
