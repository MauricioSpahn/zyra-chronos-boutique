-- Draft checkout sessions: only create a real order after confirmed payment
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  order_number TEXT NOT NULL UNIQUE,
  customer_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mercadopago',
  payment_reference TEXT,
  payment_id TEXT,
  preference_id TEXT,
  status TEXT NOT NULL DEFAULT 'initiated',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create checkout sessions"
ON public.checkout_sessions
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can read checkout sessions"
ON public.checkout_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete checkout sessions"
ON public.checkout_sessions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update checkout sessions"
ON public.checkout_sessions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_created_at ON public.checkout_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON public.checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_order_number ON public.checkout_sessions(order_number);

CREATE OR REPLACE FUNCTION public.update_checkout_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_checkout_sessions_updated_at ON public.checkout_sessions;
CREATE TRIGGER update_checkout_sessions_updated_at
BEFORE UPDATE ON public.checkout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_checkout_sessions_updated_at();

-- Allow admins to delete test orders and related items
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enforce unique numeric-like order numbers going forward in app code and ensure DB uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique ON public.orders(order_number);