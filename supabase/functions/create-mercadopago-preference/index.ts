import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Usuário inválido.",
          details: userError?.message ?? null,
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { items, shipping = 0 } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Carrinho vazio." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const normalizedItems = items.map((item: any) => ({
      product_id: item.product_id ?? null,
      name: String(item.name ?? "Produto"),
      quantity: Number(item.quantity ?? 1),
      price: Number(item.price ?? 0),
    }));

    const invalidItem = normalizedItems.find(
      (item) =>
        !item.name ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.price) ||
        item.price <= 0
    );

    if (invalidItem) {
      return new Response(JSON.stringify({ error: "Itens inválidos no carrinho." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const shippingValue = Number(shipping || 0);
    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal + shippingValue;
    const orderNumber = `CYPHUS-${Date.now()}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "Aguardando pagamento",
        total,
        shipping_cost: shippingValue,
        payment_provider: "mercadopago",
        payment_status: "pending",
        order_nsu: orderNumber,
      })
      .select()
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          error: "Não foi possível criar o pedido.",
          details: orderError,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const orderItems = normalizedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      return new Response(
        JSON.stringify({
          error: "Pedido criado, mas falhou ao salvar os itens.",
          details: itemsError,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const mpItems = normalizedItems.map((item) => ({
      title: item.name,
      quantity: item.quantity,
      currency_id: "BRL",
      unit_price: Number((item.price / 100).toFixed(2)),
    }));

    if (shippingValue > 0) {
      mpItems.push({
        title: "Frete",
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number((shippingValue / 100).toFixed(2)),
      });
    }

    const siteUrl = Deno.env.get("SITE_URL");
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: mpItems,
        external_reference: orderNumber,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
        back_urls: {
          success: `${siteUrl}/checkout-sucesso.html?order_nsu=${encodeURIComponent(orderNumber)}`,
          failure: `${siteUrl}/checkout-erro.html?order_nsu=${encodeURIComponent(orderNumber)}`,
          pending: `${siteUrl}/checkout-pendente.html?order_nsu=${encodeURIComponent(orderNumber)}`,
        },
        auto_return: "approved",
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Erro ao criar preferência no Mercado Pago.",
          details: mpData,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const checkoutUrl = mpData.init_point || mpData.sandbox_init_point || null;
    const preferenceId = mpData.id || null;

    await supabaseAdmin
      .from("orders")
      .update({ invoice_slug: preferenceId })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        order_id: order.id,
        order_nsu: orderNumber,
        preference_id: preferenceId,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Erro interno na função.",
        details: String(error),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});