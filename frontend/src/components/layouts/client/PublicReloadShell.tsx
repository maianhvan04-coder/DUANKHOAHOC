"use client";

import { type ReactNode } from "react";
import AiChatWidget from "@/components/ai/AiChatWidget";
import Footer from "@/components/layouts/client/footer/Footer";
import Navbar from "@/components/layouts/client/navbar/Navbar";

export default function PublicReloadShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <AiChatWidget role="public" />
    </>
  );
}
