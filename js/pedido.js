import { supabase } from "./supabase.js";

async function carregarPedido() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = "entrar.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  if (!orderId) {
    document.getElementById("order-detail").innerHTML =
      `<p class="auth-message">Pedido não informado.</p>`;
    return;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, shipping_amount, shipping_address, created_at")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    document.getElementById("order-detail").innerHTML =
      `<p class="auth-message">Não foi possível carregar o pedido.</p>`;
    return;
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  if (itemsError) {
    document.getElementById("order-detail").innerHTML =
      `<p class="auth-message">Erro ao carregar itens do pedido.</p>`;
    return;
  }

  renderPedido(order, items || []);
}

function renderPedido(order, items) {
  const container = document.getElementById("order-detail");

  container.innerHTML = `
    <article class="order-card detail-card">
      <div class="order-top">
        <div>
          <h2 class="order-title">Pedido ${order.order_number}</h2>
          <p class="order-date">Realizado em ${new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
        <span class="order-status status-${order.status}">
          ${traduzirStatus(order.status)}
        </span>
      </div>

      <div class="detail-grid">
        <div class="account-card detail-block">
          <h3 class="account-card-title">Resumo</h3>
          <p class="account-line"><strong>Total:</strong> R$ ${Number(order.total_amount).toFixed(2).replace(".", ",")}</p>
          <p class="account-line"><strong>Frete:</strong> R$ ${Number(order.shipping_amount).toFixed(2).replace(".", ",")}</p>
          <p class="account-line"><strong>Endereço:</strong> ${order.shipping_address || "Não informado"}</p>
        </div>

        <div class="account-card detail-block">
          <h3 class="account-card-title">Itens do pedido</h3>
          <div class="detail-items">
            ${items.length ? items.map(item => `
              <div class="detail-item">
                <div>
                  <p class="detail-item-name">${item.product_name}</p>
                  <p class="detail-item-meta">Quantidade: ${item.quantity}</p>
                </div>
                <p class="detail-item-price">
                  R$ ${Number(item.unit_price).toFixed(2).replace(".", ",")}
                </p>
              </div>
            `).join("") : '<p class="order-text">Nenhum item encontrado.</p>'}
          </div>
        </div>
      </div>
    </article>
  `;
}

function traduzirStatus(status) {
  const mapa = {
    pending: "Pendente",
    paid: "Pago",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado"
  };

  return mapa[status] || status;
}

carregarPedido();