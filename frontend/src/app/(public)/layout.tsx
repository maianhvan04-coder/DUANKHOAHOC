import Footer from "@/components/layouts/client/footer/Footer";
import Navbar from "@/components/layouts/client/navbar/Navbar";
import { UserPreferencesProvider } from "@/i18n";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserPreferencesProvider>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </UserPreferencesProvider>
  );
}
