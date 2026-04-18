import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://xvtcbkiucwyybdfeewtv.supabase.co", // seu URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dGNia2l1Y3d5eWJkZmVld3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzQyNTQsImV4cCI6MjA5MTUxMDI1NH0.8iWkuN5qDgo0iMHCOH6K0dx1J0WNgxC_3z2y4ixIbdA" // sua anon key
);


const CART_KEY = 'cyphus_cart';

const stepPessoal = document.getElementById("step-pessoal");
const stepEntrega = document.getElementById("step-entrega");
const stepPagamento = document.getElementById("step-pagamento");

const btnToEntrega = document.getElementById("btn-to-entrega");
const btnToPagamento = document.getElementById("btn-to-pagamento");
const btnFinalizar = document.getElementById("btn-finalizar");

const paymentButtons = document.querySelectorAll(".payment-option");
const pixContainer = document.getElementById("pix-container");
const pixQrImage = document.getElementById("pix-qr-image");
const pixCode = document.getElementById("pix-code");
const pixStatus = document.getElementById("pix-status");
const btnCopiarPix = document.getElementById("btn-copiar-pix");


const cpfInput = document.getElementById("cpf");

cpfInput?.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "");
  value = value.slice(0, 11);

  if (value.length > 9) {
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  } else if (value.length > 6) {
    value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  } else if (value.length > 3) {
    value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  }

  e.target.value = value;
});

let selectedPaymentMethod = "card";

paymentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    paymentButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    selectedPaymentMethod = button.dataset.method;
  });
});

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

function getFormData() {
  return {
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
    cpf: document.getElementById("cpf")?.value.trim().replace(/\D/g, "") || ""
  };
}

function validatePersonalStep() {
  const nome = document.getElementById("nome-completo").value.trim();
  const email = document.getElementById("email-checkout").value.trim();

  if (!nome || !email) {
    alert("Preencha nome e email.");
    return false;
  }

  return true;
}

function validateShippingStep() {
  const cep = document.getElementById("cep").value.trim();
  const rua = document.getElementById("rua").value.trim();
  const numero = document.getElementById("numero").value.trim();
  const bairro = document.getElementById("bairro").value.trim();
  const cidade = document.getElementById("cidade").value.trim();
  const estado = document.getElementById("estado").value.trim();

  if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
    alert("Preencha todos os campos de entrega.");
    return false;
  }

  return true;
}

if (btnToEntrega) {
  btnToEntrega.addEventListener("click", () => {
    if (!validatePersonalStep()) return;

    stepPessoal.style.display = "none";
    stepEntrega.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (btnToPagamento) {
  btnToPagamento.addEventListener("click", () => {
    if (!validateShippingStep()) return;

    stepEntrega.style.display = "none";
    stepPagamento.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

async function iniciarPagamentoCartao(cartData, formData) {
  const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
    body: cartData
  });

  if (error) {
    console.error("Erro completo da função:", error);

    if (error.context) {
      const errorText = await error.context.text();
      console.error("Resposta da função:", errorText);
      throw new Error(errorText);
    } else {
      throw new Error(error.message || "Tente novamente");
    }
  }

  if (data && data.checkout_url) {
    localStorage.setItem('order_data', JSON.stringify({
      order_nsu: data.order_nsu,
      order_id: data.order_id,
      form_data: formData
    }));

    window.location.href = data.checkout_url;
    return;
  }

  throw new Error("URL de pagamento não gerada.");
}

async function iniciarPagamentoPix(cartData, formData) {
  const subtotal = parseFloat(localStorage.getItem('subtotal') || '0');
  const frete = parseFloat(localStorage.getItem('frete') || '0');
  const total = parseFloat(localStorage.getItem('total') || (subtotal + frete));

  const [first_name = "", ...rest] = formData.full_name.split(" ");
  const last_name = rest.join(" ");

  const payload = {
    transaction_amount: Number(total),
    description: "Pedido Cyphus",
    cart: cartData.items,
    shipping: cartData.shipping,
    customer: {
      first_name,
      last_name,
      email: formData.email,
      cpf: formData.cpf
    },
    address: {
      cep: formData.cep,
      rua: formData.rua,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado
    }
  };

// 1. Pega a sessão atual do usuário
const { data: { session } } = await supabase.auth.getSession();

if (!session?.access_token) {
  throw new Error("Usuário não autenticado.");
}

// 2. Chama a Edge Function enviando o token no header
const { data, error } = await supabase.functions.invoke(
  'create-mercadopago-pix',
  {
    body: payload,
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  }
);

if (error) {
  console.error("Erro PIX:", error);

  if (error.context) {
    const errorText = await error.context.text();
    console.error("Resposta PIX:", errorText);
    throw new Error(errorText);
  } else {
    throw new Error(error.message || "Tente novamente");
  }
}


  const transactionData = data?.point_of_interaction?.transaction_data;

  if (!transactionData?.qr_code) {
    throw new Error("Dados PIX não retornados.");
  }

  if (pixQrImage) {
    pixQrImage.src = `data:image/png;base64,${transactionData.qr_code_base64}`;
  }

  if (pixCode) {
    pixCode.value = transactionData.qr_code;
  }

  if (pixStatus) {
    pixStatus.textContent = `Status: ${data.status || 'pending'}`;
  }

  if (pixContainer) {
    pixContainer.classList.remove("hidden");
    pixContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  localStorage.setItem('order_data', JSON.stringify({
    order_id: data.id || null,
    payment_id: data.id || null,
    payment_type: 'pix',
    form_data: formData
  }));
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

      const formData = getFormData();

      if (selectedPaymentMethod === "card") {
        await iniciarPagamentoCartao(cartData, formData);
        return;
      }

      if (selectedPaymentMethod === "pix") {
        if (!formData.cpf || formData.cpf.length !== 11) {
          alert("Preencha um CPF válido para pagamento via PIX.");
          return;
        }

        await iniciarPagamentoPix(cartData, formData);
        return;
      }

      alert("Selecione uma forma de pagamento.");
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      btnFinalizar.textContent = "Finalizar pedido";
      btnFinalizar.disabled = false;
    }
  });
}

if (btnCopiarPix) {
  btnCopiarPix.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pixCode.value);
      btnCopiarPix.textContent = "Código copiado!";
      setTimeout(() => {
        btnCopiarPix.textContent = "Copiar código PIX";
      }, 2000);
    } catch (err) {
      alert("Não foi possível copiar o código PIX.");
    }
  });
}

updateSummary();