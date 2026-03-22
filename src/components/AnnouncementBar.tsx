import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AnnouncementBar = () => {
  const [text, setText] = useState("ENVÍOS SIN CARGO A TODO EL PAÍS");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "announcement_bar")
        .maybeSingle();
      if (data) {
        const val = data.value as any;
        if (val?.text) setText(val.text);
      }
    };
    fetch();
  }, []);

  if (!text) return null;

  return (
    <div className="bg-accent text-accent-foreground h-8 flex items-center overflow-hidden relative z-[60]">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-16">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="font-mono text-[10px] uppercase tracking-[0.3em] font-medium"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
