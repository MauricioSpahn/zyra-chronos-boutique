import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import { Loader2 } from "lucide-react";

const CustomPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("custom_pages")
      .select("title,content")
      .eq("slug", slug || "")
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) navigate("/404", { replace: true });
        else setPage(data);
        setLoading(false);
      });
  }, [slug, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 px-6 md:px-12 py-16 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : page && (
          <>
            <h1 className="font-mono text-3xl md:text-4xl tracking-tighter text-foreground mb-8">
              {page.title}
            </h1>
            <div
              className="prose prose-invert max-w-none font-sans text-muted-foreground [&_h2]:font-mono [&_h2]:text-foreground [&_h2]:tracking-tight [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-mono [&_h3]:text-foreground [&_a]:text-accent [&_a]:no-underline [&_a:hover]:underline [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </>
        )}
      </main>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
};

export default CustomPage;
