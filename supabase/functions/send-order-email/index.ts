import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderEmailPayload {
  order_number: string;
  email: string;
  first_name: string;
  last_name: string;
  items: Array<{ name: string; price: number; quantity: number; image?: string }>;
  subtotal: number;
  shipping_cost: number;
  total: number;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  type?: "purchase" | "newsletter";
}

function buildPurchaseEmail(data: OrderEmailPayload): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;font-family:'Courier New',monospace;font-size:13px;color:#e0e0e0;">
        ${item.name}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;font-family:'Courier New',monospace;font-size:13px;color:#999;text-align:center;">
        ${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;font-family:'Courier New',monospace;font-size:13px;color:#e0e0e0;text-align:right;">
        $${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#1a1a1a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        
        <!-- Header -->
        <tr><td style="padding:40px 32px;text-align:center;border-bottom:1px solid #2a2a2a;">
          <h1 style="margin:0;font-family:'Courier New',monospace;font-size:28px;letter-spacing:12px;color:#f0f0f0;font-weight:600;">ZYRA</h1>
        </td></tr>

        <!-- Thank you -->
        <tr><td style="padding:48px 32px 24px;">
          <h2 style="margin:0 0 16px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#6B7CFF;">Confirmación de compra</h2>
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:22px;color:#f0f0f0;font-weight:600;">
            ¡Gracias por tu compra, ${data.first_name}!
          </p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#888;line-height:1.6;">
            Tu pedido ha sido confirmado y está siendo procesado. A continuación encontrarás los detalles de tu orden.
          </p>
        </td></tr>

        <!-- Order number -->
        <tr><td style="padding:0 32px 32px;">
          <table width="100%" style="background-color:#222;padding:20px 24px;">
            <tr>
              <td style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;">Orden Nº</td>
              <td style="font-family:'Courier New',monospace;font-size:18px;color:#f0f0f0;text-align:right;letter-spacing:2px;">#${data.order_number}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Items -->
        <tr><td style="padding:0 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 12px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;border-bottom:1px solid #2a2a2a;">Producto</td>
              <td style="padding:0 0 12px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;text-align:center;border-bottom:1px solid #2a2a2a;">Cant.</td>
              <td style="padding:0 0 12px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;text-align:right;border-bottom:1px solid #2a2a2a;">Precio</td>
            </tr>
            ${itemsHtml}
          </table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="padding:0 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:#888;">Subtotal</td>
              <td style="padding:8px 0;font-family:'Courier New',monospace;font-size:13px;color:#e0e0e0;text-align:right;">$${data.subtotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:13px;color:#888;">Envío</td>
              <td style="padding:8px 0;font-family:'Courier New',monospace;font-size:13px;color:#e0e0e0;text-align:right;">${data.shipping_cost === 0 ? "Gratis" : "$" + data.shipping_cost.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:16px 0 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;border-top:1px solid #2a2a2a;">Total</td>
              <td style="padding:16px 0 0;font-family:'Courier New',monospace;font-size:22px;color:#f0f0f0;text-align:right;border-top:1px solid #2a2a2a;">$${data.total.toLocaleString()}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Shipping address -->
        <tr><td style="padding:0 32px 32px;">
          <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;">Dirección de envío</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#e0e0e0;line-height:1.6;">
            ${data.first_name} ${data.last_name}<br>
            ${data.address}<br>
            ${data.city}, ${data.state} ${data.postal_code}
          </p>
        </td></tr>

        <!-- Receipt link -->
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;color:#888;">
            Podés descargar tu comprobante en PDF desde el siguiente enlace:
          </p>
          <a href="https://zyra-chronos-boutique.lovable.app/recibo/${data.order_number}" style="display:inline-block;padding:14px 32px;background-color:#6B7CFF;color:#ffffff;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;font-weight:600;">
            Descargar comprobante
          </a>
        </td></tr>

        <!-- Social -->
        <tr><td style="padding:32px;border-top:1px solid #2a2a2a;text-align:center;">
          <p style="margin:0 0 16px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;">Seguinos en redes</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding:0 12px;">
                <a href="https://instagram.com/zyra" style="color:#6B7CFF;font-family:'Courier New',monospace;font-size:12px;text-decoration:none;letter-spacing:2px;">INSTAGRAM</a>
              </td>
              <td style="padding:0 12px;">
                <a href="https://wa.me/" style="color:#25D366;font-family:'Courier New',monospace;font-size:12px;text-decoration:none;letter-spacing:2px;">WHATSAPP</a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#666;">
            ¿Tenés alguna consulta? Escribinos por WhatsApp, te respondemos al instante.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center;">
          <p style="margin:0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#555;">
            © 2026 ZYRA. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildNewsletterWelcomeEmail(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#1a1a1a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:40px 32px;text-align:center;border-bottom:1px solid #2a2a2a;">
          <h1 style="margin:0;font-family:'Courier New',monospace;font-size:28px;letter-spacing:12px;color:#f0f0f0;font-weight:600;">ZYRA</h1>
        </td></tr>
        <tr><td style="padding:48px 32px 24px;text-align:center;">
          <h2 style="margin:0 0 16px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#6B7CFF;">Bienvenido al universo ZYRA</h2>
          <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:18px;color:#f0f0f0;font-weight:600;">
            Gracias por suscribirte
          </p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#888;line-height:1.6;max-width:400px;display:inline-block;">
            Ahora sos parte de nuestra comunidad. Te vamos a mantener al tanto de nuevos lanzamientos, ediciones limitadas y novedades exclusivas.
          </p>
        </td></tr>
        <tr><td style="padding:32px;border-top:1px solid #2a2a2a;text-align:center;">
          <p style="margin:0 0 16px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;">Seguinos en redes</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding:0 12px;">
                <a href="https://instagram.com/zyra" style="color:#6B7CFF;font-family:'Courier New',monospace;font-size:12px;text-decoration:none;letter-spacing:2px;">INSTAGRAM</a>
              </td>
              <td style="padding:0 12px;">
                <a href="https://wa.me/" style="color:#25D366;font-family:'Courier New',monospace;font-size:12px;text-decoration:none;letter-spacing:2px;">WHATSAPP</a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center;">
          <p style="margin:0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#555;">© 2026 ZYRA. TODOS LOS DERECHOS RESERVADOS.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type = "purchase" } = body;

    const gmailUser = "administracion.zyra@gmail.com";
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!gmailPass) {
      throw new Error("GMAIL_APP_PASSWORD not configured");
    }

    // Get contact info for social links
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: contactSettings } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "contact")
      .maybeSingle();

    const contact = contactSettings?.value as any || {};
    const instagramUrl = contact.instagram || "https://instagram.com/zyra";
    const whatsappNum = contact.whatsapp || "";

    let html: string;
    let subject: string;
    let recipientEmail: string;

    if (type === "newsletter") {
      recipientEmail = body.email;
      subject = "Bienvenido al universo ZYRA";
      html = buildNewsletterWelcomeEmail();
      // Replace social links
      html = html.replace('href="https://instagram.com/zyra"', `href="${instagramUrl}"`);
      if (whatsappNum) {
        html = html.replace('href="https://wa.me/"', `href="https://wa.me/${whatsappNum}"`);
      }
    } else {
      const data = body as OrderEmailPayload;
      recipientEmail = data.email;
      subject = `ZYRA — Confirmación de compra #${data.order_number}`;
      html = buildPurchaseEmail(data);
      // Replace social links
      html = html.replace('href="https://instagram.com/zyra"', `href="${instagramUrl}"`);
      if (whatsappNum) {
        html = html.replace('href="https://wa.me/"', `href="https://wa.me/${whatsappNum}"`);
      }
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPass,
        },
      },
    });

    await client.send({
      from: `ZYRA <${gmailUser}>`,
      to: recipientEmail,
      subject,
      content: "auto",
      html,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-order-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
