// =========================
// CARRINHO — STORAGE
// =========================

const CART_KEY = 'cyphus_cart';

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveCart = cart => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

const getCartCount = () =>
  getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);

// =========================
// CÁLCULO DE TOTAIS
// =========================

function calculateTotals(cart) {
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0
  );
  const frete = subtotal > 0 ? 15 : 0;
  const total = subtotal + frete;
  return { subtotal, frete, total };
}

// =========================
// ATUALIZA RESUMO (CARRINHO + CHECKOUT)
// =========================

function updateSummary() {
  const subtotalEl = document.getElementById('subtotal');
  const freteEl = document.getElementById('frete');
  const totalEl = document.getElementById('total');

  // Se a página não tiver resumo, não faz nada
  if (!subtotalEl && !freteEl && !totalEl) return;

  const cart = getCart();
  const { subtotal, frete, total } = calculateTotals(cart);

  if (subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
  if (freteEl) freteEl.textContent = `R$ ${frete.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2)}`;

  localStorage.setItem('subtotal', subtotal.toFixed(2));
  localStorage.setItem('frete', frete.toFixed(2));
  localStorage.setItem('total', total.toFixed(2));
}

// =========================
// TOAST
// =========================

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;

  // Reinicia animação
  toast.classList.remove('show');
  void toast.offsetWidth;

  // Mostra
  toast.classList.add('show');

  // Remove depois de 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// =========================
// ADICIONAR AO CARRINHO
// =========================

function addToCart(item) {
  if (!item || !item.name || !item.price) {
    console.warn('Item inválido ao adicionar ao carrinho:', item);
    return;
  }

  const cart = getCart();

  // Se tiver ID, usa ID + tamanho; senão, nome + tamanho
  const existing = cart.find(p =>
    (item.id && p.id === item.id || p.name === item.name) &&
    p.size === item.size
  );

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: item.id || null,
      name: item.name,
      price: Number(item.price),
      image: item.image || '',
      size: item.size || null,
      quantity: 1
    });
  }

  saveCart(cart);
  updateCartCount();
  updateSummary();
  showToast('Produto adicionado ao carrinho');
}

// =========================
// RENDERIZA PÁGINA DO CARRINHO
// =========================

function renderCartPage() {
  const container = document.getElementById('cart-items');
  const emptyMsg = document.getElementById('cart-empty-message');
  if (!container) return;

  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    updateSummary();
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  container.innerHTML = cart
    .map((item, index) => {
      const qty = item.quantity || 1;
      const total = Number(item.price || 0) * qty;
      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-info">
            <h3>${item.name}</h3>
            ${item.size ? `<p>Tamanho: ${item.size}</p>` : ''}
            <div class="cart-qty-row">
              <button class="qty-btn qty-minus" data-index="${index}">-</button>
              <span class="cart-qty">${qty}</span>
              <button class="qty-btn qty-plus" data-index="${index}">+</button>
            </div>
            <p class="cart-item-price">R$ ${total.toFixed(2)}</p>
            <button class="cart-remove" data-index="${index}">Remover</button>
          </div>
        </div>
      `;
    })
    .join('');

  // Atualiza resumo com base no carrinho atual
  updateSummary();

  // Eventos
  container
    .querySelectorAll('.cart-remove')
    .forEach(btn =>
      btn.addEventListener('click', () =>
        updateItem(Number(btn.dataset.index), 'remove')
      )
    );

  container
    .querySelectorAll('.qty-plus')
    .forEach(btn =>
      btn.addEventListener('click', () =>
        updateItem(Number(btn.dataset.index), 'plus')
      )
    );

  container
    .querySelectorAll('.qty-minus')
    .forEach(btn =>
      btn.addEventListener('click', () =>
        updateItem(Number(btn.dataset.index), 'minus')
      )
    );
}

// =========================
// ATUALIZA ITEM DO CARRINHO
// =========================

function updateItem(index, action) {
  const cart = getCart();
  const item = cart[index];
  if (!item) return;

  if (action === 'plus') {
    item.quantity = (item.quantity || 1) + 1;
  }

  if (action === 'minus') {
    if ((item.quantity || 1) > 1) {
      item.quantity--;
    } else {
      cart.splice(index, 1);
    }
  }

  if (action === 'remove') {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCartPage();
  updateCartCount();
  updateSummary();
}

// =========================
// SELEÇÃO DE TAMANHO + ADD
// =========================

function setupProductSizeSelection() {
  const sizeButtons = document.querySelectorAll('.size-option');
  const addBtn = document.querySelector('.add-to-cart-btn');
  if (!addBtn) return;

  let selectedSize =
    document.querySelector('.size-option.is-active')?.dataset.size || null;

  sizeButtons.forEach(btn =>
    btn.addEventListener('click', () => {
      sizeButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      selectedSize = btn.dataset.size || null;
    })
  );

  addBtn.addEventListener('click', () => {
    if (!selectedSize) {
      showToast('Selecione um tamanho');
      return;
    }

    addToCart({
      id: addBtn.dataset.id || null,
      name: addBtn.dataset.name,
      price: Number(addBtn.dataset.price),
      image: addBtn.dataset.image,
      size: selectedSize
    });
  });
}

// =========================
// CHECKOUT (OPCIONAL)
// =========================

function setupCheckoutButton() {
  const btn = document.getElementById('btnCheckout');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const cart = getCart();
    if (!cart.length) {
      showToast('Seu carrinho está vazio');
      return;
    }
    // Redireciona para página de checkout (ajuste o nome se for diferente)
    window.location.href = 'checkout.html';
  });
}

// =========================
// INICIALIZAÇÃO
// =========================

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const count = getCartCount();
  el.textContent = count ? `(${count})` : '';
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cart-items')) {
    renderCartPage();
    setupCheckoutButton();
  }
  setupProductSizeSelection();
  updateCartCount();
  updateSummary();
});

