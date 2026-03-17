import Footer from "@/components/layouts/client/footer/Footer";
import Navbar from "@/components/layouts/client/navbar/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}