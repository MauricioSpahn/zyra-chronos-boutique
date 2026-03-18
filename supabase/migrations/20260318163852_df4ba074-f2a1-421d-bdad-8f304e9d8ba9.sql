
-- Site settings table for homepage customization
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed default homepage settings
INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"title": "Precisión sin ornamento", "subtitle": "Cada pieza Zyra es un ejercicio de reducción. Sin excesos. Sin concesiones. Solo el tiempo en su forma más pura.", "buttonText": "Explorar colección"}'),
  ('brand', '{"tagline": "Relojería esencial", "footer_text": "Manufactura independiente · Ediciones limitadas · Envío mundial"}');
