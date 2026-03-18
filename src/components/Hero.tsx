import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import heroWatch from "@/assets/hero-watch.jpg";
import { supabase } from "@/integrations/supabase/client";

interface HeroSettings {
  title: string;
  subtitle: string;
  buttonText: string;
}

const defaultSettings: HeroSettings = {
  title: "Precisión sin ornamento",
  subtitle: "Cada pieza Zyra es un ejercicio de reducción. Sin excesos. Sin concesiones. Solo el tiempo en su forma más pura.",
  buttonText: "Explorar colección",
};

const Hero = () => {
  const [settings, setSettings] = useState<HeroSettings>(defaultSettings);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const val = data.value as Record<string, string>;
          setSettings({
            title: val.title || defaultSettings.title,
            subtitle: val.subtitle || defaultSettings.subtitle,
            buttonText: val.buttonText || defaultSettings.buttonText,
          });
        }
      });
  }, []);

  return (
    <section className="relative h-[80vh] w-full overflow-hidden flex items-end">
      <div className="absolute inset-0">
        <img src={heroWatch} alt="ZYRA reloj de precisión" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1], delay: 0.7 }}
        >
          <a
            href="#collection"
            className="inline-block mt-8 h-12 px-8 leading-[3rem] bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
          >
            {settings.buttonText}
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
