ALTER TABLE public.products
ADD COLUMN badge_free_shipping boolean NOT NULL DEFAULT false,
ADD COLUMN badge_discount_percent integer DEFAULT NULL;