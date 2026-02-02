// ===== Search + Filter =====
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const chips = document.querySelectorAll(".chip");
const items = document.querySelectorAll(".item");

let activeFilter = "all";

function applyFilters() {
  const q = (searchInput.value || "").toLowerCase().trim();

  items.forEach((card) => {
    const category = card.dataset.category;
    const name = (card.dataset.name || "").toLowerCase();
    const desc = (card.querySelector(".desc")?.textContent || "").toLowerCase();

    const matchFilter = (activeFilter === "all") || (category === activeFilter);
    const matchSearch = !q || name.includes(q) || desc.includes(q);

    card.style.display = (matchFilter && matchSearch) ? "block" : "none";
  });

  // Hide sections with no visible items
  document.querySelectorAll(".section").forEach((sec) => {
    const visible = Array.from(sec.querySelectorAll(".item"))
      .some((it) => it.style.display !== "none");
    sec.style.display = visible ? "block" : "none";
  });
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  applyFilters();
});

document.getElementById("year").textContent = new Date().getFullYear();
applyFilters();


// ===== CART SYSTEM =====
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartPanel = document.getElementById("cartPanel");
const overlay = document.getElementById("overlay");

const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");

const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");

// ✅ NEW: Location input (add this input in your HTML)
const customerLocationInput = document.getElementById("customerLocation");

// ✅ Your WhatsApp number
const WHATSAPP_NUMBER = "96176717577"; // no +, no spaces

// cart: { id: {name, price, qty} }
let cart = loadCart();

function openCart() {
  cartPanel.classList.add("open");
  overlay.classList.add("show");
  cartPanel.setAttribute("aria-hidden", "false");
}
function closeCart() {
  cartPanel.classList.remove("open");
  overlay.classList.remove("show");
  cartPanel.setAttribute("aria-hidden", "true");
}

openCartBtn?.addEventListener("click", openCart);
closeCartBtn?.addEventListener("click", closeCart);
overlay?.addEventListener("click", closeCart);

function saveCart() {
  localStorage.setItem("drive_drip_cart", JSON.stringify(cart));
}
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("drive_drip_cart")) || {};
  } catch {
    return {};
  }
}

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

function cartCount() {
  return Object.values(cart).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
}

function cartTotal() {
  return Object.values(cart).reduce((sum, it) => {
    const price = Number(it.price) || 0;
    const qty = Number(it.qty) || 0;
    return sum + price * qty;
  }, 0);
}

function renderCart() {
  cartItemsEl.innerHTML = "";

  const entries = Object.entries(cart);

  if (entries.length === 0) {
    cartItemsEl.innerHTML = `<p class="muted">Your cart is empty.</p>`;
  } else {
    entries.forEach(([id, it]) => {
      const row = document.createElement("div");
      row.className = "cart-item";

      row.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${it.name}</div>
            <div class="cart-item-price">${formatMoney(it.price)} each</div>
          </div>
          <button class="remove-btn" data-remove="${id}" type="button">Remove</button>
        </div>

        <div class="qty-row">
          <div class="qty-controls">
            <button class="qty-btn" data-dec="${id}" type="button">−</button>
            <span class="qty-num">${it.qty}</span>
            <button class="qty-btn" data-inc="${id}" type="button">+</button>
          </div>
          <strong>${formatMoney(it.price * it.qty)}</strong>
        </div>
      `;

      cartItemsEl.appendChild(row);
    });
  }

  cartTotalEl.textContent = formatMoney(cartTotal());
  cartCountEl.textContent = String(cartCount());
  saveCart();
}

function addToCart(name, price) {
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const p = Number(price) || 0;

  if (!cart[id]) {
    cart[id] = { name, price: p, qty: 1 };
  } else {
    cart[id].qty += 1;
  }
  renderCart();
}

document.addEventListener("click", (e) => {
  const btn = e.target;

  // Add to cart
  if (btn.classList.contains("add-btn")) {
    const card = btn.closest(".item");
    const name = card?.dataset?.name || "Item";
    const price = parseFloat(card?.dataset?.price || "0");

    addToCart(name, price);
    openCart();
  }

  // Remove
  const removeId = btn.dataset?.remove;
  if (removeId) {
    delete cart[removeId];
    renderCart();
  }

  // Increase
  const incId = btn.dataset?.inc;
  if (incId && cart[incId]) {
    cart[incId].qty += 1;
    renderCart();
  }

  // Decrease
  const decId = btn.dataset?.dec;
  if (decId && cart[decId]) {
    cart[decId].qty -= 1;
    if (cart[decId].qty <= 0) delete cart[decId];
    renderCart();
  }
});

clearCartBtn?.addEventListener("click", () => {
  cart = {};
  renderCart();
});


// ✅ ✅ WhatsApp checkout with Location
checkoutBtn?.addEventListener("click", (e) => {
  e.preventDefault();

  if (cartCount() === 0) {
    alert("Your cart is empty.");
    return;
  }

  const location = (customerLocationInput?.value || "").trim();

  if (!location) {
    alert("Please enter your location / address.");
    customerLocationInput?.focus();
    return;
  }

  let msg = "Hello,I want to make an order from Drive & Drip\n\n";
  msg += `Location: ${location}\n\n`;
  msg += "Order:\n";

  Object.values(cart).forEach((it) => {
    const name = it.name || "Item";
    const qty = Number(it.qty) || 1;
    const price = Number(it.price) || 0;

    const lineTotal = qty * price;
    msg += `• ${name} x${qty} = ${formatMoney(lineTotal)}\n`;
  });

  msg += `\n Total: ${formatMoney(cartTotal())}\n`;
 

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
});


// First render
renderCart();
