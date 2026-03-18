
-- Hero slides table
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hero slides" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Admins can insert hero slides" ON public.hero_slides FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hero slides" ON public.hero_slides FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete hero slides" ON public.hero_slides FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Page visits table
CREATE TABLE public.page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT '/',
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page visits" ON public.page_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read page visits" ON public.page_visits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Hero media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('hero', 'hero', true);

CREATE POLICY "Anyone can view hero media" ON storage.objects FOR SELECT USING (bucket_id = 'hero');
CREATE POLICY "Admins can upload hero media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hero' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hero media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hero' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete hero media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hero' AND public.has_role(auth.uid(), 'admin'));
