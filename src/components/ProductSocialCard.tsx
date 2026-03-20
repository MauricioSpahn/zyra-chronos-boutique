import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import {
  SOCIAL_TEMPLATES,
  renderSocialTemplate,
  type ProductSocialData,
} from "@/components/product-social/socialTemplates";

interface Props {
  product: ProductSocialData;
}

const ProductSocialCard = ({ product }: Props) => {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);

  const handleDownload = async (templateId: string) => {
    const node = cardRefs.current[templateId];
    if (!node) return;

    setGeneratingTemplate(templateId);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
        fetchRequestInit: { mode: "cors" },
      });

      const link = document.createElement("a");
      link.download = `${product.name.replace(/\s+/g, "_")}_${templateId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating promotional PNG:", error);
    } finally {
      setGeneratingTemplate(null);
    }
  };

  return (
    <div className="space-y-4 border-t border-foreground/[0.08] pt-6">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Piezas promocionales para stories
        </p>
        <p className="font-sans text-sm text-muted-foreground max-w-2xl text-pretty">
          Descargá hasta 10 plantillas de alto impacto para WhatsApp e Instagram, sin precio y fieles al lenguaje visual de Zyra.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {SOCIAL_TEMPLATES.map((template) => {
          const isLoading = generatingTemplate === template.id;

          return (
            <button
              key={template.id}
              onClick={() => handleDownload(template.id)}
              disabled={Boolean(generatingTemplate)}
              className="h-12 px-4 border border-foreground/[0.08] bg-secondary text-foreground font-sans font-medium uppercase tracking-[0.16em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={1.5} />}
              {template.name}
            </button>
          );
        })}
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute -left-[99999px] top-0 opacity-0">
        {SOCIAL_TEMPLATES.map((template) => (
          <div
            key={template.id}
            ref={(node) => {
              cardRefs.current[template.id] = node;
            }}
          >
            {renderSocialTemplate(template.id, product)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSocialCard;