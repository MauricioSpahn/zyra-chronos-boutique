import type { CSSProperties } from "react";

export interface ProductSocialData {
  name: string;
  reference?: string | null;
  image_url: string | null;
  gallery: string[];
  description: string | null;
}

export interface SocialTemplateDefinition {
  id: string;
  name: string;
}

const colors = {
  background: "hsl(0 0% 10%)",
  backgroundSoft: "hsl(0 0% 14%)",
  backgroundMuted: "hsl(0 0% 18%)",
  foreground: "hsl(0 0% 95%)",
  muted: "hsl(0 0% 66%)",
  subtle: "hsl(0 0% 40%)",
  accent: "hsl(230 70% 55%)",
  accentSoft: "hsl(230 70% 68%)",
  line: "hsla(0 0% 95% / 0.1)",
  paper: "hsl(0 0% 94%)",
  ink: "hsl(0 0% 9%)",
};

const monoFamily = '"Geist Mono", "SFMono-Regular", ui-monospace, monospace';
const sansFamily = '"Instrument Sans", ui-sans-serif, system-ui, sans-serif';

export const SOCIAL_TEMPLATES: SocialTemplateDefinition[] = [
  { id: "hero-cinematic", name: "Plantilla 01" },
  { id: "editorial-split", name: "Plantilla 02" },
  { id: "film-strip", name: "Plantilla 03" },
  { id: "atelier-grid", name: "Plantilla 04" },
  { id: "blueprint", name: "Plantilla 05" },
  { id: "poster-frame", name: "Plantilla 06" },
  { id: "triptych", name: "Plantilla 07" },
  { id: "spotlight", name: "Plantilla 08" },
  { id: "contact-sheet", name: "Plantilla 09" },
  { id: "paper-catalog", name: "Plantilla 10" },
];

const storyFrame: CSSProperties = {
  width: 1080,
  height: 1920,
  overflow: "hidden",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  color: colors.foreground,
  background: colors.background,
};

const fillImage: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const labelStyle: CSSProperties = {
  fontFamily: monoFamily,
  fontSize: 14,
  letterSpacing: "0.32em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  fontFamily: monoFamily,
  fontSize: 72,
  lineHeight: 1,
  letterSpacing: "-0.04em",
  margin: 0,
  overflowWrap: "break-word",
};

const descriptionStyle: CSSProperties = {
  fontFamily: sansFamily,
  fontSize: 26,
  lineHeight: 1.45,
  color: colors.muted,
  margin: 0,
  overflowWrap: "break-word",
  whiteSpace: "pre-line",
};

function getImages(product: ProductSocialData) {
  const raw = [product.image_url, ...(Array.isArray(product.gallery) ? product.gallery : [])].filter(Boolean) as string[];
  const fallback = raw[0] ?? "/placeholder.svg";
  const pool = raw.length > 0 ? raw : [fallback];

  while (pool.length < 4) pool.push(pool[pool.length % Math.max(pool.length, 1)] ?? fallback);

  return pool;
}

function getExcerpt(text: string | null) {
  if (!text?.trim()) return "Diseño mecánico con presencia escultórica y lenguaje brutalista.";
  return text.trim().split("\n").filter(Boolean).join(" ").slice(0, 140);
}

function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <div
      style={{
        ...labelStyle,
        color: inverted ? colors.ink : colors.foreground,
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <span>ZYRA</span>
      <span style={{ width: 64, height: 1, background: inverted ? "hsla(0 0% 9% / 0.2)" : colors.line }} />
    </div>
  );
}

function ProductName({ name, inverted = false, large = false }: { name: string; inverted?: boolean; large?: boolean }) {
  return (
    <h2
      style={{
        ...titleStyle,
        fontSize: large ? 94 : 72,
        color: inverted ? colors.ink : colors.foreground,
      }}
    >
      {name}
    </h2>
  );
}

function ReferenceTag({ reference, inverted = false }: { reference?: string | null; inverted?: boolean }) {
  if (!reference) return null;

  return (
    <p
      style={{
        ...labelStyle,
        fontSize: 12,
        color: inverted ? "hsla(0 0% 9% / 0.65)" : colors.accentSoft,
        margin: 0,
      }}
    >
      Ref. {reference}
    </p>
  );
}

function ImageTile({ src, style }: { src: string; style?: CSSProperties }) {
  return <img src={src} alt="" crossOrigin="anonymous" style={{ ...fillImage, ...style }} />;
}

export function renderSocialTemplate(templateId: string, product: ProductSocialData) {
  const images = getImages(product);
  const excerpt = getExcerpt(product.description);

  switch (templateId) {
    case "hero-cinematic":
      return (
        <div style={{ ...storyFrame, background: colors.background }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <ImageTile src={images[0]} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, hsla(0 0% 10% / 0.1) 0%, hsla(0 0% 10% / 0.2) 38%, hsla(0 0% 10% / 0.92) 100%)" }} />
          <div style={{ position: "relative", zIndex: 1, padding: "56px 56px 70px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            <BrandMark />
            <div style={{ maxWidth: 820 }}>
              <ReferenceTag reference={product.reference} />
              <div style={{ height: 22 }} />
              <ProductName name={product.name} large />
              <p style={{ ...descriptionStyle, marginTop: 28, maxWidth: 740 }}>{excerpt}</p>
            </div>
          </div>
        </div>
      );

    case "editorial-split":
      return (
        <div style={{ ...storyFrame, background: colors.background }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", height: "100%" }}>
            <div style={{ padding: 56, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: `1px solid ${colors.line}` }}>
              <BrandMark />
              <div>
                <ReferenceTag reference={product.reference} />
                <div style={{ height: 24 }} />
                <ProductName name={product.name} />
                <p style={{ ...descriptionStyle, marginTop: 30 }}>{excerpt}</p>
              </div>
              <p style={{ ...labelStyle, fontSize: 12, color: colors.accentSoft, margin: 0 }}>Estado · Story · Campaña</p>
            </div>
            <div style={{ display: "grid", gridTemplateRows: "1fr 320px", gap: 10, padding: 10 }}>
              <div style={{ overflow: "hidden" }}><ImageTile src={images[0]} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ overflow: "hidden" }}><ImageTile src={images[1]} /></div>
                <div style={{ overflow: "hidden" }}><ImageTile src={images[2]} /></div>
              </div>
            </div>
          </div>
        </div>
      );

    case "film-strip":
      return (
        <div style={{ ...storyFrame, background: colors.backgroundMuted }}>
          <div style={{ height: 4, background: colors.accent }} />
          <div style={{ padding: "38px 44px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <BrandMark />
            <ReferenceTag reference={product.reference} />
          </div>
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "130px 1fr 130px", gap: 14, flex: 1 }}>
            <div style={{ display: "grid", gridTemplateRows: "repeat(3, 1fr)", gap: 14 }}>
              {images.slice(1, 4).map((image, index) => (
                <div key={index} style={{ overflow: "hidden", border: `1px solid ${colors.line}` }}><ImageTile src={image} /></div>
              ))}
            </div>
            <div style={{ overflow: "hidden", position: "relative" }}>
              <ImageTile src={images[0]} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, hsla(0 0% 10% / 0) 0%, hsla(0 0% 10% / 0.65) 100%)" }} />
              <div style={{ position: "absolute", left: 40, right: 40, bottom: 40 }}>
                <ProductName name={product.name} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div style={{ transform: "rotate(180deg)", writingMode: "vertical-rl", ...labelStyle, color: colors.muted }}>ZYRA / STORY RELEASE</div>
            </div>
          </div>
        </div>
      );

    case "atelier-grid":
      return (
        <div style={{ ...storyFrame, background: colors.background }}>
          <div style={{ padding: 56, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <BrandMark />
            <p style={{ ...labelStyle, fontSize: 12, color: colors.muted, margin: 0 }}>Nueva pieza</p>
          </div>
          <div style={{ padding: "0 56px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "640px 420px 1fr", gap: 14, flex: 1 }}>
            <div style={{ gridColumn: "1 / span 2", overflow: "hidden" }}><ImageTile src={images[0]} /></div>
            <div style={{ overflow: "hidden" }}><ImageTile src={images[1]} /></div>
            <div style={{ padding: 28, border: `1px solid ${colors.line}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <ReferenceTag reference={product.reference} />
                <div style={{ height: 18 }} />
                <ProductName name={product.name} />
              </div>
              <p style={descriptionStyle}>{excerpt}</p>
            </div>
            <div style={{ overflow: "hidden" }}><ImageTile src={images[2]} /></div>
            <div style={{ overflow: "hidden" }}><ImageTile src={images[3]} /></div>
          </div>
        </div>
      );

    case "blueprint":
      return (
        <div style={{ ...storyFrame, background: "linear-gradient(180deg, hsl(230 24% 14%) 0%, hsl(230 22% 10%) 100%)" }}>
          <div style={{ position: "absolute", inset: 28, border: "1px solid hsla(230 70% 80% / 0.18)" }} />
          <div style={{ position: "absolute", inset: 56, border: "1px solid hsla(230 70% 80% / 0.12)" }} />
          <div style={{ position: "relative", zIndex: 1, padding: 72, display: "flex", flexDirection: "column", height: "100%" }}>
            <BrandMark />
            <div style={{ flex: 1, display: "grid", gridTemplateRows: "1fr auto", gap: 36, marginTop: 48 }}>
              <div style={{ border: "1px solid hsla(230 70% 80% / 0.18)", padding: 18, overflow: "hidden" }}><ImageTile src={images[0]} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24 }}>
                <div>
                  <ReferenceTag reference={product.reference} />
                  <div style={{ height: 18 }} />
                  <ProductName name={product.name} />
                </div>
                <p style={{ ...descriptionStyle, color: "hsla(0 0% 95% / 0.74)" }}>{excerpt}</p>
              </div>
            </div>
          </div>
        </div>
      );

    case "poster-frame":
      return (
        <div style={{ ...storyFrame, background: colors.background }}>
          <div style={{ padding: 46, flex: 1, display: "grid", gridTemplateRows: "auto 1fr auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <BrandMark />
              <span style={{ ...labelStyle, fontSize: 12, color: colors.accentSoft }}>ZYRA / 2026</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 20, alignItems: "stretch", marginTop: 32 }}>
              <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", ...titleStyle, fontSize: 82 }}>ZYRA</div>
              <div style={{ position: "relative", border: `1px solid ${colors.line}`, padding: 12 }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, hsla(230 70% 55% / 0.2) 0%, hsla(0 0% 10% / 0) 42%)" }} />
                <div style={{ position: "relative", overflow: "hidden", height: "100%" }}><ImageTile src={images[0]} /></div>
              </div>
            </div>
            <div style={{ marginTop: 34 }}>
              <ReferenceTag reference={product.reference} />
              <div style={{ height: 16 }} />
              <ProductName name={product.name} />
            </div>
          </div>
        </div>
      );

    case "triptych":
      return (
        <div style={{ ...storyFrame, background: colors.backgroundSoft }}>
          <div style={{ padding: 56, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <BrandMark />
            <ReferenceTag reference={product.reference} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 12, padding: "0 56px", flex: 1 }}>
            <div style={{ overflow: "hidden" }}><ImageTile src={images[1]} /></div>
            <div style={{ overflow: "hidden", position: "relative" }}>
              <ImageTile src={images[0]} />
              <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px hsla(0 0% 95% / 0.12)" }} />
            </div>
            <div style={{ overflow: "hidden" }}><ImageTile src={images[2]} /></div>
          </div>
          <div style={{ padding: "36px 56px 56px" }}>
            <ProductName name={product.name} />
            <p style={{ ...descriptionStyle, marginTop: 18, maxWidth: 760 }}>{excerpt}</p>
          </div>
        </div>
      );

    case "spotlight":
      return (
        <div style={{ ...storyFrame, background: "radial-gradient(circle at 50% 32%, hsla(230 70% 55% / 0.28) 0%, hsla(230 70% 55% / 0.06) 24%, hsl(0 0% 10%) 62%)" }}>
          <div style={{ padding: 56, display: "flex", flexDirection: "column", height: "100%" }}>
            <BrandMark />
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 760, height: 920, padding: 18, border: `1px solid ${colors.line}`, background: "hsla(0 0% 95% / 0.02)" }}>
                <div style={{ width: "100%", height: "100%", overflow: "hidden" }}><ImageTile src={images[0]} /></div>
              </div>
            </div>
            <div>
              <ReferenceTag reference={product.reference} />
              <div style={{ height: 14 }} />
              <ProductName name={product.name} />
            </div>
          </div>
        </div>
      );

    case "contact-sheet":
      return (
        <div style={{ ...storyFrame, background: colors.background }}>
          <div style={{ padding: 46, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <BrandMark />
            <span style={{ ...labelStyle, fontSize: 12, color: colors.muted }}>4 vistas</span>
          </div>
          <div style={{ padding: "0 46px 46px", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr auto", gap: 12, flex: 1 }}>
            {images.slice(0, 4).map((image, index) => (
              <div key={index} style={{ overflow: "hidden", minHeight: 0 }}><ImageTile src={image} /></div>
            ))}
            <div style={{ gridColumn: "1 / span 2", paddingTop: 18, borderTop: `1px solid ${colors.line}` }}>
              <ReferenceTag reference={product.reference} />
              <div style={{ height: 12 }} />
              <ProductName name={product.name} />
            </div>
          </div>
        </div>
      );

    case "paper-catalog":
      return (
        <div style={{ ...storyFrame, background: colors.paper, color: colors.ink }}>
          <div style={{ height: 8, background: colors.accent }} />
          <div style={{ padding: 52, display: "grid", gridTemplateRows: "auto auto 1fr auto", height: "100%" }}>
            <BrandMark inverted />
            <div style={{ marginTop: 22 }}>
              <ReferenceTag reference={product.reference} inverted />
              <div style={{ height: 18 }} />
              <ProductName name={product.name} inverted />
            </div>
            <div style={{ marginTop: 34, overflow: "hidden", border: "1px solid hsla(0 0% 9% / 0.12)" }}><ImageTile src={images[0]} /></div>
            <p style={{ ...descriptionStyle, color: "hsla(0 0% 9% / 0.68)", marginTop: 26 }}>{excerpt}</p>
          </div>
        </div>
      );

    default:
      return null;
  }
}