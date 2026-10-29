import { Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import PublicLayout from "@/components/site/PublicLayout";

import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import PropertyDetail from "@/pages/PropertyDetail";
import Sobre from "@/pages/Sobre";
import Contato from "@/pages/Contato";
import Favoritos from "@/pages/Favoritos";
import Comparar from "@/pages/Comparar";
import Simulador from "@/pages/Simulador";
import PoliticaPrivacidade from "@/pages/PoliticaPrivacidade";
import NotFound from "@/pages/NotFound";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProperties from "@/pages/admin/Properties";
import AdminPropertyForm from "@/pages/admin/PropertyForm";
import AdminLeads from "@/pages/admin/Leads";
import AdminTestimonials from "@/pages/admin/Testimonials";
import AdminDevelopers from "@/pages/admin/Developers";
import AdminSettings from "@/pages/admin/Settings";

// One <Route> per page; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/lancamentos" element={<Catalog kind="lancamento" />} />
          <Route path="/comprar" element={<Catalog kind="venda" />} />
          <Route path="/alugar" element={<Catalog kind="locacao" />} />
          <Route path="/imoveis" element={<Catalog kind="all" />} />
          <Route path="/imoveis/:slug" element={<PropertyDetail />} />
          <Route path="/empreendimentos/:slug" element={<PropertyDetail />} />
          <Route path="/locacao/:slug" element={<PropertyDetail />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/comparar" element={<Comparar />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="imoveis" element={<AdminProperties />} />
          <Route path="imoveis/novo" element={<AdminPropertyForm />} />
          <Route path="imoveis/:id" element={<AdminPropertyForm />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="depoimentos" element={<AdminTestimonials />} />
          <Route path="construtoras" element={<AdminDevelopers />} />
          <Route path="configuracoes" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
