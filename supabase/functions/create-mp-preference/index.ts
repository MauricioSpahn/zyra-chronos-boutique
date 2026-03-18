import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, items, payer, back_urls } = await req.json();

    if (!order_id || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "order_id and items are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build preference items for MercadoPago
    const mpItems = items.map((item: any) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
    }));

    const preferenceBody: any = {
      items: mpItems,
      external_reference: order_id,
      auto_return: "approved",
    };

    if (payer) {
      preferenceBody.payer = {
        email: payer.email,
        name: payer.first_name,
        surname: payer.last_name,
      };
    }

    if (back_urls) {
      preferenceBody.back_urls = back_urls;
    }

    // Create MercadoPago preference
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MercadoPago error:", JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ error: `MercadoPago API error [${mpResponse.status}]`, details: mpData }),
        { status: mpResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order payment_reference with preference id
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseAdmin
      .from("orders")
      .update({ payment_reference: mpData.id, payment_method: "mercadopago" })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
        preference_id: mpData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
