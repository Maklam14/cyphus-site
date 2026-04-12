import { supabase } from "./supabase.js";

async function carregarPainel() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "entrar.html";
    return;
  }

  const user = data.session.user;

  document.getElementById("user-email").textContent = user.email || "";
  document.getElementById("user-id").textContent = user.id || "";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, endereco")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Erro ao carregar perfil:", profileError.message);
    document.getElementById("user-name").textContent = "Não informado";
    document.getElementById("user-address").textContent = "Não informado";
  } else {
    document.getElementById("user-name").textContent = profile?.full_name || "Não informado";
    document.getElementById("user-address").textContent = profile?.endereco || "Não informado";
  }

  await carregarPedidos(user.id);
}

async function carregarPedidos(userId) {
  const ordersList = document.getElementById("orders-list");

  ordersList.innerHTML = "<p class='auth-message'>Carregando pedidos...</p>";

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, shipping_amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    ordersList.innerHTML = `<p class="auth-message">Erro ao carregar pedidos: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    ordersList.innerHTML = `
      <article class="order-card empty-order">
        <h3 class="order-title">Nenhum pedido ainda</h3>
        <p class="order-text">Quando você fizer sua primeira compra, ela aparecerá aqui.</p>
      </article>
    `;
    return;
  }

  ordersList.innerHTML = data.map(order => `
    <article class="order-card">
      <div class="order-top">
        <div>
          <h3 class="order-title">Pedido ${order.order_number}</h3>
          <p class="order-date">${new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
        <span class="order-status status-${order.status}">
          ${traduzirStatus(order.status)}
        </span>
      </div>

      <div class="order-body">
        <p><strong>Total:</strong> R$ ${Number(order.total_amount).toFixed(2).replace(".", ",")}</p>
        <p><strong>Frete:</strong> R$ ${Number(order.shipping_amount).toFixed(2).replace(".", ",")}</p>
      </div>

      <div class="order-footer">
        <a href="pedido.html?id=${order.id}" class="order-link">Ver detalhes</a>
      </div>
    </article>
  `).join("");
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

carregarPainel();
