Zyra luxury watch e-commerce: dark brutalist design, no rounded corners, Geist Mono + Instrument Sans fonts

## Design System
- Background: hsl(0 0% 10%) deep black
- Foreground: hsl(0 0% 95%) off white  
- Accent: hsl(230 70% 55%) cobalt blue
- Muted: hsl(0 0% 18%) carbon gray
- Borders: foreground/[0.08] (subtle white)
- Border radius: 0px everywhere (rounded-none)
- Buttons: h-12 px-8, uppercase tracking-[0.2em] text-[10px], sharp corners
- Motion: cubic-bezier(0.19, 1, 0.22, 1), 400ms pages, 150ms hovers
- No soft shadows, no stock photos, no popup subscriptions
- Prices: font-mono tabular-nums
- Copy: "Adquirir pieza" not "Comprar", "Unidades numeradas" not "Stock"

## Architecture  
- 100% custom on Lovable Cloud (no Shopify)
- Guest checkout (no registration required to buy)
- Admin system for categories + product management
- Mercado Pago for payments via checkout_sessions flow
- Orders created ONLY after confirmed payment
- Numeric-only order numbers
- AnnouncementBar (editable) + Header offset pt-24
- /coleccion page with search, categories, subcategories
- Device ID (MP security script) in index.html
