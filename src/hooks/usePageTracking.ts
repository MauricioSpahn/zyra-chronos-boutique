import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    supabase.from("page_visits").insert({
      page: location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  }, [location.pathname]);
}
