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
    const { payment_id, session_id } = await req.json();

    if (!payment_id && !session_id) {
      return new Response(
        JSON.stringify({ error: "payment_id or session_id required" }),
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

    // Verify payment with MercadoPago API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpRes.ok) {
      return new Response(
        JSON.stringify({ error: "Could not verify payment", status: mpRes.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpPayment = await mpRes.json();
    const isApproved = mpPayment.status === "approved";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find checkout session
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from("checkout_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionErr || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update session status
    await supabaseAdmin.from("checkout_sessions").update({
      status: isApproved ? "approved" : mpPayment.status,
      payment_id: String(payment_id),
      approved_at: isApproved ? new Date().toISOString() : null,
    }).eq("id", session_id);

    // If approved, create the real order
    if (isApproved && session.status !== "approved") {
      const customer = session.customer_data as any;
      const { data: order, error: orderErr } = await supabaseAdmin.from("orders").insert({
        order_number: session.order_number,
        email: customer.email,
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: customer.phone || null,
        address_line1: customer.addressLine1,
        address_line2: customer.addressLine2 || null,
        city: customer.city,
        state: customer.state,
        postal_code: customer.postalCode,
        country: customer.country || "MX",
        payment_method: "mercadopago",
        payment_status: "paid",
        payment_reference: String(payment_id),
        subtotal: session.subtotal,
        shipping_cost: session.shipping_cost,
        total: session.total,
        status: "confirmed",
      }).select().single();

      if (!orderErr && order) {
        const items = (session.items as any[]).map((item: any) => ({
          order_id: order.id,
          product_name: item.name,
          product_image: item.image || null,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        }));
        await supabaseAdmin.from("order_items").insert(items);

        // Send confirmation email
        try {
          const emailPayload = {
            type: "purchase",
            order_number: session.order_number,
            email: customer.email,
            first_name: customer.firstName,
            last_name: customer.lastName,
            items: (session.items as any[]).map((item: any) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image || null,
            })),
            subtotal: session.subtotal,
            shipping_cost: session.shipping_cost,
            total: session.total,
            address: customer.addressLine1,
            city: customer.city,
            state: customer.state,
            postal_code: customer.postalCode,
          };

          await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify(emailPayload),
            }
          );
        } catch (emailErr) {
          console.error("Email send error (non-blocking):", emailErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ approved: isApproved, status: mpPayment.status, order_number: session.order_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("confirm-mp-payment error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
