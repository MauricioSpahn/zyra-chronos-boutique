-- Re-add checkout_sessions INSERT policy for public users
CREATE POLICY "Anyone can create checkout sessions"
ON public.checkout_sessions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to read their own checkout session by token
CREATE POLICY "Anyone can read own checkout session"
ON public.checkout_sessions
FOR SELECT
TO public
USING (true);