
-- Admin profiles table
CREATE TABLE public.admin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all admin profiles" ON public.admin_profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert admin profiles" ON public.admin_profiles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update own profile" ON public.admin_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  admin_name text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log" ON public.audit_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add managed_by and delivered_at to orders
ALTER TABLE public.orders ADD COLUMN managed_by uuid;
ALTER TABLE public.orders ADD COLUMN managed_by_name text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN delivered_at timestamptz;

-- Contact settings (will use site_settings table with key 'contact')
-- No new table needed, we'll use site_settings
