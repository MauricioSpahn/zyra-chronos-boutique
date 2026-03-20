import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface Props {
  product: {
    name: string;
    price: number;
    currency: string;
    image_url: string | null;
    gallery: string[];
    description: string | null;
  };
}

const ProductSocialCard = ({ product }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const currencySymbol =
    product.currency === "ARS"
      ? "ARS $"
      : product.currency === "EUR"
      ? "€"
      : product.currency === "MXN"
      ? "MX $"
      : "$";

  const images = [
    product.image_url,
    ...(Array.isArray(product.gallery) ? product.gallery : []),
  ].filter(Boolean) as string[];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        fetchRequestInit: { mode: "cors" },
      });
      const link = document.createElement("a");
      link.download = `${product.name.replace(/\s+/g, "_")}_social.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={generating}
        className="inline-flex items-center gap-2 h-10 px-5 bg-accent text-accent-foreground font-sans font-medium uppercase tracking-[0.15em] text-[10px] hover:bg-accent/90 transition-colors duration-150 disabled:opacity-50"
      >
        {generating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} strokeWidth={1.5} />
        )}
        Descargar PNG
      </button>

      {/* Hidden card for rendering */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
        }}
      >
        <div
          ref={cardRef}
          style={{
            width: 1080,
            height: 1920,
            background: "linear-gradient(180deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Geist Mono', 'SF Mono', monospace",
            color: "#f2f2f2",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top accent line */}
          <div style={{ height: 4, background: "hsl(230, 70%, 55%)", width: "100%" }} />

          {/* Brand */}
          <div
            style={{
              padding: "48px 56px 24px",
              fontSize: 14,
              letterSpacing: "0.35em",
              textTransform: "uppercase" as const,
              color: "#888",
            }}
          >
            ZYRA
          </div>

          {/* Main image */}
          <div
            style={{
              margin: "0 56px",
              height: 900,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {images[0] && (
              <img
                src={images[0]}
                alt=""
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>

          {/* Gallery row */}
          {images.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                margin: "12px 56px 0",
                height: 200,
              }}
            >
              {images.slice(1, 4).map((img, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    crossOrigin="anonymous"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Product info */}
          <div
            style={{
              padding: "40px 56px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <h2
              style={{
                fontSize: 42,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {product.name}
            </h2>
            <p
              style={{
                fontSize: 36,
                fontWeight: 400,
                marginTop: 16,
                color: "hsl(230, 70%, 65%)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {currencySymbol}
              {product.price.toLocaleString()}
            </p>

            {/* Bottom accent */}
            <div
              style={{
                marginTop: 40,
                height: 1,
                background: "rgba(255,255,255,0.1)",
              }}
            />
            <p
              style={{
                marginTop: 16,
                fontSize: 12,
                letterSpacing: "0.3em",
                textTransform: "uppercase" as const,
                color: "#666",
              }}
            >
              zyra-chronos-boutique.lovable.app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSocialCard;
