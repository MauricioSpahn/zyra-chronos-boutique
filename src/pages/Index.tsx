import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import { usePageTracking } from "@/hooks/usePageTracking";

const Index = () => {
  usePageTracking();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <Hero />
        <ProductGrid />
      </main>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
};

export default Index;
