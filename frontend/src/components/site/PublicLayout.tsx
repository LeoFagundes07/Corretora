import { Outlet } from "react-router-dom";

import CompareBar from "@/components/site/CompareBar";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import WhatsAppFloat from "@/components/site/WhatsAppFloat";

export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-[#F7F4EF]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <CompareBar />
    </div>
  );
}
