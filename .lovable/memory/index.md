Design system, architecture, and key decisions for Zyra luxury watch e-commerce

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
- Admin system at /admin with role-based auth (user_roles table)
- Stripe for payments (to enable later)
- Cart: React Context + localStorage persistence
- DB tables: categories, products, user_roles (with app_role enum)
- Static product data in src/data/products.ts (demo catalog)
- Admin CRUD at /admin, login at /admin/login
