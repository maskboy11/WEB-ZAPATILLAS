// ================= ESTADO GLOBAL =================

// Datos del catálogo cargados de data.json
let storeData = {
  productos: [],
  pedidos: []
};

// Carrito en memoria
let cart = [];

// Producto actualmente abierto en detalle
let currentProductId = null;

// ================= UTILIDADES =================

function formatPrice(value) {
  return value.toFixed(2);
}

/**
 * Simula guardar pedidos en "data.json" utilizando localStorage
 * (el front puro no puede escribir ficheros en disco, por eso se usa este enfoque).[web:16]
 */
function persistOrders() {
  localStorage.setItem("urbankicks_orders", JSON.stringify(storeData.pedidos));
}

function loadPersistedOrders() {
  const raw = localStorage.getItem("urbankicks_orders");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      storeData.pedidos = parsed;
    }
  } catch (e) {
    console.warn("No se pudieron leer pedidos guardados");
  }
}

function updateCartCount() {
  const countEl = document.getElementById("cart-count");
  const total = cart.reduce((acc, item) => acc + item.cantidad, 0);
  countEl.textContent = total;
}

function showSection(id) {
  document.querySelectorAll(".uk-section").forEach(section => {
    section.classList.toggle("uk-section--active", section.id === id);
  });
}

// ================= MARCAS =================

function renderBrands() {
  const brandsGrid = document.getElementById("brands-grid");
  brandsGrid.innerHTML = "";

  const brands = [...new Set(storeData.productos.map(p => p.marca))];

  brands.forEach(brand => {
    const card = document.createElement("article");
    card.className = "uk-brand-card";
    card.dataset.brand = brand;

    const name = document.createElement("h2");
    name.className = "uk-brand-card__name";
    name.textContent = brand;

    const label = document.createElement("p");
    label.className = "uk-brand-card__label";
    label.textContent = "Ver modelos " + brand;

    const tag = document.createElement("span");
    tag.className = "uk-brand-card__tag";
    tag.textContent = "Sneakers · Street";

    card.appendChild(name);
    card.appendChild(label);
    card.appendChild(tag);

    card.addEventListener("click", () => {
      renderProductsByBrand(brand);
      showSection("products-section");
    });

    brandsGrid.appendChild(card);
  });
}

// ================= LISTADO DE PRODUCTOS =================

function renderProductsByBrand(brand) {
  const productsGrid = document.getElementById("products-grid");
  const titleEl = document.getElementById("products-title");

  titleEl.textContent = "Modelos " + brand;
  productsGrid.innerHTML = "";

  const filtered = storeData.productos.filter(p => p.marca === brand);

  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "uk-product-card";
    card.dataset.id = product.id;

    const media = document.createElement("div");
    media.className = "uk-product-card__media";

    const img = document.createElement("img");
    img.className = "uk-product-card__img";
    img.src = product.imagenes[0];
    img.alt = product.nombre;

    media.appendChild(img);

    const body = document.createElement("div");
    body.className = "uk-product-card__body";

    const nameEl = document.createElement("h3");
    nameEl.className = "uk-product-card__name";
    nameEl.textContent = product.nombre;

    const meta = document.createElement("div");
    meta.className = "uk-product-card__meta";

    const brandEl = document.createElement("span");
    brandEl.className = "uk-product-card__brand";
    brandEl.textContent = product.marca;

    const priceEl = document.createElement("span");
    priceEl.className = "uk-product-card__price";
    priceEl.textContent = formatPrice(product.precio) + " €";

    meta.appendChild(brandEl);
    meta.appendChild(priceEl);

    body.appendChild(nameEl);
    body.appendChild(meta);

    card.appendChild(media);
    card.appendChild(body);

    card.addEventListener("click", () => {
      openProductDetail(product.id);
      showSection("product-detail-section");
    });

    productsGrid.appendChild(card);
  });
}

// ================= DETALLE PRODUCTO =================

function openProductDetail(productId) {
  const product = storeData.productos.find(p => p.id === productId);
  if (!product) return;

  currentProductId = productId;

  const mainImg = document.getElementById("product-main-image");
  const thumbs = document.getElementById("product-thumbs");
  const brandEl = document.getElementById("product-brand");
  const nameEl = document.getElementById("product-name");
  const priceEl = document.getElementById("product-price");
  const addBtn = document.getElementById("add-to-cart-btn");

  brandEl.textContent = product.marca;
  nameEl.textContent = product.nombre;
  priceEl.textContent = formatPrice(product.precio);

  mainImg.src = product.imagenes[0];
  mainImg.alt = product.nombre;

  thumbs.innerHTML = "";
  product.imagenes.forEach((url, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "uk-thumb" + (index === 0 ? " uk-thumb--active" : "");
    const img = document.createElement("img");
    img.src = url;
    img.alt = product.nombre + " imagen " + (index + 1);

    btn.appendChild(img);
    btn.addEventListener("click", () => {
      mainImg.src = url;
      thumbs.querySelectorAll(".uk-thumb").forEach(t => t.classList.remove("uk-thumb--active"));
      btn.classList.add("uk-thumb--active");
    });

    thumbs.appendChild(btn);
  });

  addBtn.dataset.productId = String(product.id);
}

function addCurrentProductToCart() {
  if (!currentProductId) return;
  const product = storeData.productos.find(p => p.id === currentProductId);
  if (!product) return;

  // Sin tallas para simplificar flujo (solo cantidad por producto)
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.cantidad += 1;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      marca: product.marca,
      precio: product.precio,
      imagen: product.imagenes[0],
      cantidad: 1
    });
  }

  updateCartCount();
}

// ================= CARRITO =================

function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  container.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Tu carrito está vacío.";
    container.appendChild(empty);
    totalEl.textContent = "0.00";
    checkoutBtn.disabled = true;
    return;
  }

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "uk-cart-item";

    const imgWrap = document.createElement("div");
    imgWrap.className = "uk-cart-item__img-wrap";
    const img = document.createElement("img");
    img.src = item.imagen;
    img.alt = item.nombre;
    imgWrap.appendChild(img);

    const info = document.createElement("div");
    info.className = "uk-cart-item__info";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = item.nombre;

    const brandSpan = document.createElement("span");
    brandSpan.textContent = item.marca;

    const qtySpan = document.createElement("span");
    qtySpan.textContent = "Cantidad: " + item.cantidad;

    info.appendChild(nameSpan);
    info.appendChild(brandSpan);
    info.appendChild(qtySpan);

    const right = document.createElement("div");
    right.style.textAlign = "right";

    const priceSpan = document.createElement("div");
    priceSpan.className = "uk-cart-item__price";
    const subtotal = item.precio * item.cantidad;
    priceSpan.textContent = formatPrice(subtotal) + " €";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "uk-cart-item__remove";
    removeBtn.textContent = "Eliminar";
    removeBtn.addEventListener("click", () => {
      cart.splice(index, 1);
      renderCart();
      updateCartCount();
    });

    right.appendChild(priceSpan);
    right.appendChild(removeBtn);

    row.appendChild(imgWrap);
    row.appendChild(info);
    row.appendChild(right);

    container.appendChild(row);

    total += subtotal;
  });

  totalEl.textContent = formatPrice(total);
  checkoutBtn.disabled = false;
}

function fillProductsSummary() {
  const textarea = document.getElementById("products-summary");
  if (cart.length === 0) {
    textarea.value = "Sin productos.";
    return;
  }
  const lines = cart.map(
    item =>
      `${item.nombre} (${item.marca}) x${item.cantidad} - ${formatPrice(
        item.precio * item.cantidad
      )} €`
  );
  textarea.value = lines.join("\n");
}

// ================= FORMULARIO / PEDIDOS =================

function generateOrderId() {
  return "ORD-" + Date.now();
}

function handleOrderSubmit(event) {
  event.preventDefault();

  const messageEl = document.getElementById("order-message");

  if (cart.length === 0) {
    messageEl.textContent = "Tu carrito está vacío.";
    messageEl.style.color = "#ef4444";
    return;
  }

  const fullName = document.getElementById("full-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const city = document.getElementById("city").value.trim();

  if (!fullName || !email || !phone || !city) {
    messageEl.textContent = "Completa todos los campos para continuar.";
    messageEl.style.color = "#f59e0b";
    return;
  }

  const newOrder = {
    id: generateOrderId(),
    fecha: new Date().toISOString(),
    cliente: {
      nombre: fullName,
      email,
      telefono: phone,
      ciudad: city
    },
    productos: cart.map(item => ({
      id_producto: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio
    })),
    estado: "pendiente"
  };

  storeData.pedidos.push(newOrder);
  persistOrders();

  cart = [];
  updateCartCount();
  renderCart();
  fillProductsSummary();

  messageEl.textContent =
    "Pedido enviado. Te contactaremos para finalizar el pago.";
  messageEl.style.color = "#16a34a";

  document.getElementById("order-form").reset();
}

// ================= INICIALIZACIÓN =================

async function initStore() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();
    storeData = data;
    loadPersistedOrders();
    renderBrands();
    updateCartCount();
  } catch (error) {
    console.error("Error cargando data.json", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Navegación principal
  document.getElementById("nav-home").addEventListener("click", () => {
    showSection("brands-section");
  });

  document.getElementById("nav-cart").addEventListener("click", () => {
    renderCart();
    showSection("cart-section");
  });

  // Navegación secundaria
  document.getElementById("back-to-brands").addEventListener("click", () => {
    showSection("brands-section");
  });

  document.getElementById("back-to-products").addEventListener("click", () => {
    showSection("products-section");
  });

  document.getElementById("back-from-cart").addEventListener("click", () => {
    showSection("brands-section");
  });

  document.getElementById("back-to-cart").addEventListener("click", () => {
    showSection("cart-section");
  });

  // Botones de flujo
  document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    addCurrentProductToCart();
    updateCartCount();
  });

  document.getElementById("checkout-btn").addEventListener("click", () => {
    fillProductsSummary();
    showSection("checkout-section");
  });

  // Formulario
  document.getElementById("order-form").addEventListener("submit", handleOrderSubmit);

  // Arranque
  initStore();
});
