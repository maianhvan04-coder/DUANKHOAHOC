import PublicReloadShell from "@/components/layouts/client/PublicReloadShell";
import { UserPreferencesProvider } from "@/i18n";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserPreferencesProvider>
      <PublicReloadShell>{children}</PublicReloadShell>
    </UserPreferencesProvider>
  );
}
