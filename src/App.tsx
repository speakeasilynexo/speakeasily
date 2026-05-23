import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StudentProgress from "./pages/StudentProgress";
import Subscribe from "./pages/Subscribe";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";
import ContentPage from "./pages/ContentPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/u/:waId" element={<StudentProgress />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/success" element={<Success />} />
          <Route path="/aprender-ingles-por-whatsapp" element={<ContentPage staticSlug="aprender-ingles-por-whatsapp" />} />
          <Route path="/clases-de-ingles-online" element={<ContentPage staticSlug="clases-de-ingles-online" />} />
          <Route path="/aprender-ingles-rapido" element={<ContentPage staticSlug="aprender-ingles-rapido" />} />
          <Route path="/curso-de-ingles-gratis" element={<ContentPage staticSlug="curso-de-ingles-gratis" />} />
          <Route path="/ingles-para-el-trabajo" element={<ContentPage staticSlug="ingles-para-el-trabajo" />} />
          <Route path="/ingles-para-viajar" element={<ContentPage staticSlug="ingles-para-viajar" />} />
          <Route path="/como-funciona" element={<ContentPage staticSlug="como-funciona" />} />
          <Route path="/metodologia" element={<ContentPage staticSlug="metodologia" />} />
          <Route path="/pronunciacion" element={<ContentPage staticSlug="pronunciacion" />} />
          <Route path="/correccion-en-tiempo-real" element={<ContentPage staticSlug="correccion-en-tiempo-real" />} />
          <Route path="/preguntas-frecuentes" element={<ContentPage staticSlug="preguntas-frecuentes" />} />
          <Route path="/ingles-para-principiantes" element={<ContentPage staticSlug="ingles-para-principiantes" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
