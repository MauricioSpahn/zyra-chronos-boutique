import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HeroSettings {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

interface HeroSlide {
  id: string;
  media_url: string;
  media_type: string;
  sort_order: number;
}

const Hero = () => {
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", "hero").single(),
      supabase.from("hero_slides").select("*").order("sort_order"),
    ]).then(([settingsRes, slidesRes]) => {
      if (settingsRes.data?.value) {
        const val = settingsRes.data.value as Record<string, string>;
        setSettings({
          title: val.title || "",
          subtitle: val.subtitle || "",
          buttonText: val.buttonText || "",
          buttonLink: val.buttonLink || "#collection",
        });
      } else {
        setSettings({ title: "", subtitle: "", buttonText: "", buttonLink: "#collection" });
      }
      if (slidesRes.data && slidesRes.data.length > 0) {
        setSlides(slidesRes.data as HeroSlide[]);
      }
      setLoaded(true);
    });
  }, []);

  const totalSlides = slides.length || 1;

  const goTo = useCallback((index: number) => {
    setCurrentSlide((index + totalSlides) % totalSlides);
  }, [totalSlides]);

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const current = slides[currentSlide];
    if (current?.media_type === "video") return;
    intervalRef.current = setInterval(next, 6000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentSlide, totalSlides, next, slides]);

  // Don't render anything until data is loaded — fixes the flash
  if (!loaded || !settings) {
    return <section className="h-[80vh] w-full bg-background" />;
  }

  const currentMedia = slides[currentSlide];

  return (
    <section className="relative h-[80vh] w-full overflow-hidden flex items-end">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          {slides.length === 0 ? (
            <motion.div key="empty" className="w-full h-full bg-secondary" />
          ) : currentMedia?.media_type === "video" ? (
            <motion.video
              key={currentMedia.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              src={currentMedia.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <motion.img
              key={currentMedia?.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              src={currentMedia?.media_url}
              alt="ZYRA"
              className="w-full h-full object-cover object-center"
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {totalSlides > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-background/30 backdrop-blur-sm text-foreground/80 hover:bg-background/60 transition-colors" aria-label="Anterior">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-background/30 backdrop-blur-sm text-foreground/80 hover:bg-background/60 transition-colors" aria-label="Siguiente">
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-2 h-2 transition-colors ${i === currentSlide ? "bg-foreground" : "bg-foreground/30"}`} />
            ))}
          </div>
        </>
      )}

      <div className="relative z-10 w-full px-6 md:px-12 pb-16 md:pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1], delay: 0.2 }}
          className="font-mono text-5xl md:text-7xl tracking-tighter text-foreground mix-blend-difference"
        >
          {settings.title.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < settings.title.split("\n").length - 1 && <br />}
            </span>
          ))}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1], delay: 0.5 }}
          className="mt-4 font-sans text-sm md:text-base text-muted-foreground max-w-md leading-relaxed"
        >
          {settings.subtitle}
        </motion.p>
        {settings.buttonText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1], delay: 0.7 }}
          >
            <a
              href={settings.buttonLink}
              className="inline-block mt-8 h-12 px-8 leading-[3rem] bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
            >
              {settings.buttonText}
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Hero;
