import { supabase } from './js/supabase.js';

const CART_KEY = 'cyphus_cart';

const stepPessoal = document.getElementById("step-pessoal");
const stepEntrega = document.getElementById("step-entrega");
const stepPagamento = document.getElementById("step-pagamento");

const btnToEntrega = document.getElementById("btn-to-entrega");
const btnToPagamento = document.getElementById("btn-to-pagamento");
const btnFinalizar = document.getElementById("btn-finalizar");

function updateSummary() {
  const subtotal = parseFloat(localStorage.getItem('subtotal') || '0');
  const frete = parseFloat(localStorage.getItem('frete') || '0');
  const total = parseFloat(localStorage.getItem('total') || (subtotal + frete));

  document.getElementById("summary-subtotal").textContent = `R$ ${subtotal.toFixed(2)}`;
  document.getElementById("summary-frete").textContent = `R$ ${frete.toFixed(2)}`;
  document.getElementById("summary-total").textContent = `R$ ${Number(total).toFixed(2)}`;
}

function getCartData() {
  const cartItemsRaw = localStorage.getItem(CART_KEY) || '[]';
  const cartItems = JSON.parse(cartItemsRaw);

  const frete = parseFloat(localStorage.getItem('frete') || '0') * 100;

  return {
    items: cartItems.map(item => ({
      name: item.name || 'Produto',
      price: Math.round(Number(item.price || 0) * 100),
      quantity: parseInt(item.quantity || 1),
      product_id: item.id || null
    })),
    shipping: Math.round(frete)
  };
}

if (btnToEntrega) {
  btnToEntrega.addEventListener("click", () => {
    const nome = document.getElementById("nome-completo").value.trim();
    const email = document.getElementById("email-checkout").value.trim();

    if (!nome || !email) {
      alert("Preencha nome e email.");
      return;
    }

    stepPessoal.style.display = "none";
    stepEntrega.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (btnToPagamento) {
  btnToPagamento.addEventListener("click", () => {
    const cep = document.getElementById("cep").value.trim();
    const rua = document.getElementById("rua").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const bairro = document.getElementById("bairro").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const estado = document.getElementById("estado").value.trim();

    if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
      alert("Preencha todos os campos de entrega.");
      return;
    }

    stepEntrega.style.display = "none";
    stepPagamento.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (btnFinalizar) {
  btnFinalizar.addEventListener("click", async () => {
    btnFinalizar.textContent = "Processando...";
    btnFinalizar.disabled = true;

    try {
      const cartData = getCartData();

      if (cartData.items.length === 0) {
        alert("Carrinho vazio.");
        return;
      }

      const formData = {
        full_name: document.getElementById("nome-completo").value.trim(),
        email: document.getElementById("email-checkout").value.trim(),
        phone: document.getElementById("telefone").value.trim(),
        cep: document.getElementById("cep").value.trim(),
        rua: document.getElementById("rua").value.trim(),
        numero: document.getElementById("numero").value.trim(),
        complemento: document.getElementById("complemento").value.trim(),
        bairro: document.getElementById("bairro").value.trim(),
        cidade: document.getElementById("cidade").value.trim(),
        estado: document.getElementById("estado").value.trim(),
      };

      const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
        body: cartData
      });

      if (error) {
  console.error("Erro completo da função:", error);

  if (error.context) {
    const errorText = await error.context.text();
    console.error("Resposta da função:", errorText);
    alert("Erro ao processar pagamento: " + errorText);
  } else {
    alert("Erro ao processar pagamento: " + (error.message || "Tente novamente"));
  }

  return;
}

      if (data && data.checkout_url) {
        localStorage.setItem('order_data', JSON.stringify({
          order_nsu: data.order_nsu,
          order_id: data.order_id,
          form_data: formData
        }));

        window.location.href = data.checkout_url;
      } else {
        alert("Erro: URL de pagamento não gerada.");
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Erro inesperado. Tente novamente.");
    } finally {
      btnFinalizar.textContent = "Finalizar pedido";
      btnFinalizar.disabled = false;
    }
  });
}

updateSummary();