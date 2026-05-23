const STORAGE_KEY = "gallery-store-template-v1";
const PASSWORD_KEY = "gallery-store-password";
const THEME_KEY = "gallery-store-theme";
const DEFAULT_PASSWORD = "admin123";

const starterProducts = [
  {
    id: crypto.randomUUID(),
    name: "Bolso tejido Aurora",
    category: "Accesorios",
    price: "$ 89.000",
    status: "Disponible",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
    description: "Bolso liviano con textura artesanal, forro interno y cierre magn\u00e9tico.",
    featured: true
  },
  {
    id: crypto.randomUUID(),
    name: "Set cer\u00e1mica Nube",
    category: "Hogar",
    price: "$ 120.000",
    status: "Disponible",
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80",
    description: "Piezas esmaltadas para mesa, disponibles en tonos claros y acabado mate.",
    featured: true
  },
  {
    id: crypto.randomUUID(),
    name: "Camisa lino Oliva",
    category: "Ropa",
    price: "$ 145.000",
    status: "Por encargo",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
    description: "Camisa fresca de corte relajado, ideal para clima c\u00e1lido y uso diario.",
    featured: false
  },
  {
    id: crypto.randomUUID(),
    name: "Vela Botanica",
    category: "Decoraci\u00f3n",
    price: "$ 42.000",
    status: "Disponible",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80",
    description: "Aroma suave con notas herbales, vaso reutilizable y cera vegetal.",
    featured: false
  }
];

const defaultStore = {
  name: "Sublimo Shop",
  tagline: "Productos seleccionados",
  whatsapp: "573001234567",
  products: starterProducts
};

let store = loadStore();
let isLoggedIn = false;
let editingProductId = null;

const els = {
  storeNameLabel: document.querySelector("#storeNameLabel"),
  storeTaglineLabel: document.querySelector("#storeTaglineLabel"),
  footerStoreName: document.querySelector("#footerStoreName"),
  heroTitle: document.querySelector("#heroTitle"),
  heroCopy: document.querySelector("#heroCopy"),
  heroWhatsapp: document.querySelector("#heroWhatsapp"),
  productGrid: document.querySelector("#productGrid"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  totalProducts: document.querySelector("#totalProducts"),
  totalFeatured: document.querySelector("#totalFeatured"),
  adminLocked: document.querySelector("#adminLocked"),
  adminWorkspace: document.querySelector("#adminWorkspace"),
  logoutButton: document.querySelector("#logoutButton"),
  loginDialog: document.querySelector("#loginDialog"),
  loginOpen: document.querySelector("#loginOpen"),
  adminLoginButton: document.querySelector("#adminLoginButton"),
  loginClose: document.querySelector("#loginClose"),
  loginForm: document.querySelector("#loginForm"),
  passwordInput: document.querySelector("#passwordInput"),
  loginError: document.querySelector("#loginError"),
  settingsForm: document.querySelector("#settingsForm"),
  storeName: document.querySelector("#storeName"),
  whatsappNumber: document.querySelector("#whatsappNumber"),
  storeTagline: document.querySelector("#storeTagline"),
  productForm: document.querySelector("#productForm"),
  formTitle: document.querySelector("#formTitle"),
  productId: document.querySelector("#productId"),
  productName: document.querySelector("#productName"),
  productCategory: document.querySelector("#productCategory"),
  productPrice: document.querySelector("#productPrice"),
  productStatus: document.querySelector("#productStatus"),
  productImage: document.querySelector("#productImage"),
  productDescription: document.querySelector("#productDescription"),
  productFeatured: document.querySelector("#productFeatured"),
  resetFormButton: document.querySelector("#resetFormButton"),
  adminProductRows: document.querySelector("#adminProductRows"),
  toast: document.querySelector("#toast"),
  themeToggle: document.querySelector("#themeToggle")
};

function loadStore() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(defaultStore);

  try {
    return { ...structuredClone(defaultStore), ...JSON.parse(stored) };
  } catch {
    return structuredClone(defaultStore);
  }
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getPassword() {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
}

function savePassword(nextPassword) {
  localStorage.setItem(PASSWORD_KEY, nextPassword);
}

function init() {
  const theme = localStorage.getItem(THEME_KEY);
  if (theme === "dark") document.documentElement.classList.add("dark");

  if (els.settingsForm) hydrateSettingsForm();
  bindEvents();
  render();
  refreshIcons();
}

function bindEvents() {
  els.searchInput?.addEventListener("input", renderProducts);
  els.categoryFilter?.addEventListener("change", renderProducts);
  els.heroWhatsapp?.addEventListener("click", () => {
    window.open(getWhatsappUrl(`Hola, deseo recibir informaci\u00f3n de ${store.name}.`), "_blank");
  });

  els.loginOpen?.addEventListener("click", openLogin);
  els.adminLoginButton?.addEventListener("click", openLogin);
  els.loginClose?.addEventListener("click", closeLogin);
  els.loginForm?.addEventListener("submit", handleLogin);
  els.logoutButton?.addEventListener("click", logout);

  els.settingsForm?.addEventListener("submit", handleSettingsSubmit);
  els.productForm?.addEventListener("submit", handleProductSubmit);
  els.resetFormButton?.addEventListener("click", resetProductForm);
  els.themeToggle?.addEventListener("click", toggleTheme);
}

function render() {
  renderStoreIdentity();
  if (els.categoryFilter) renderCategories();
  if (els.productGrid) renderProducts();
  if (els.adminLocked) renderAdminState();
  if (els.adminProductRows) renderAdminRows();
  if (els.totalProducts) renderMetrics();
  refreshIcons();
}

function renderStoreIdentity() {
  if (els.storeNameLabel) els.storeNameLabel.textContent = store.name;
  if (els.footerStoreName) els.footerStoreName.textContent = store.name;
  if (els.storeTaglineLabel) els.storeTaglineLabel.textContent = store.tagline;
  if (els.heroTitle) els.heroTitle.textContent = store.name;
  if (els.heroCopy) {
    els.heroCopy.textContent = `${store.tagline}. Consulta disponibilidad por WhatsApp y recibe atencion personalizada.`;
  }
}

function renderCategories() {
  const selected = els.categoryFilter.value || "all";
  const categories = [...new Set(store.products.map((product) => product.category.trim()).filter(Boolean))].sort();

  els.categoryFilter.innerHTML = '<option value="all">Todas</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.append(option);
  });
  els.categoryFilter.value = categories.includes(selected) ? selected : "all";
}

function renderProducts() {
  if (!els.productGrid) return;
  const term = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const products = store.products.filter((product) => {
    const matchesText = [product.name, product.category, product.description, product.price]
      .join(" ")
      .toLowerCase()
      .includes(term);
    const matchesCategory = category === "all" || product.category === category;
    return matchesText && matchesCategory;
  });

  els.productGrid.innerHTML = "";
  els.emptyState.hidden = products.length > 0;

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        <img src="${escapeAttribute(product.image)}" alt="${escapeAttribute(product.name)}" loading="lazy">
        <span class="badge">${escapeHtml(product.featured ? "Destacado" : product.status)}</span>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span>${escapeHtml(product.category)}</span>
          <span>${escapeHtml(product.status)}</span>
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-footer">
          <span class="price">${escapeHtml(product.price)}</span>
          <a class="whatsapp-button" href="${getWhatsappUrl(buildProductMessage(product))}" target="_blank" rel="noopener" aria-label="Consultar ${escapeAttribute(product.name)} por WhatsApp" title="Consultar por WhatsApp">
            <span data-icon="message-circle"></span>
          </a>
        </div>
      </div>
    `;
    els.productGrid.append(card);
  });

  refreshIcons();
}

function renderAdminState() {
  if (!els.adminLocked || !els.adminWorkspace) return;
  els.adminLocked.hidden = isLoggedIn;
  els.adminWorkspace.hidden = !isLoggedIn;
  if (els.logoutButton) els.logoutButton.hidden = !isLoggedIn;
}

function renderAdminRows() {
  if (!els.adminProductRows) return;
  els.adminProductRows.innerHTML = "";

  store.products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${escapeHtml(product.price)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-button" type="button" data-edit="${product.id}" aria-label="Editar ${escapeAttribute(product.name)}" title="Editar">
            <span data-icon="pencil"></span>
          </button>
          <button class="icon-button" type="button" data-delete="${product.id}" aria-label="Eliminar ${escapeAttribute(product.name)}" title="Eliminar">
            <span data-icon="trash-2"></span>
          </button>
        </div>
      </td>
    `;
    els.adminProductRows.append(row);
  });

  els.adminProductRows.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => editProduct(button.dataset.edit));
  });
  els.adminProductRows.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteProduct(button.dataset.delete));
  });

  refreshIcons();
}

function renderMetrics() {
  if (!els.totalProducts || !els.totalFeatured) return;
  els.totalProducts.textContent = store.products.length;
  els.totalFeatured.textContent = store.products.filter((product) => product.featured).length;
}

function hydrateSettingsForm() {
  els.storeName.value = store.name;
  els.whatsappNumber.value = store.whatsapp;
  els.storeTagline.value = store.tagline;
}

function handleLogin(event) {
  event.preventDefault();
  if (els.passwordInput.value !== getPassword()) {
    els.loginError.hidden = false;
    return;
  }

  isLoggedIn = true;
  closeLogin();
  renderAdminState();
  showToast("Acceso concedido.");
}

function logout() {
  isLoggedIn = false;
  resetProductForm();
  renderAdminState();
  showToast("Sesi\u00f3n cerrada.");
}

function openLogin() {
  if (!els.loginDialog) return;
  els.loginError.hidden = true;
  els.passwordInput.value = "";
  if (typeof els.loginDialog.showModal === "function") {
    els.loginDialog.showModal();
  } else {
    els.loginDialog.setAttribute("open", "");
  }
  setTimeout(() => els.passwordInput.focus(), 50);
}

function closeLogin() {
  if (els.loginDialog?.open) els.loginDialog.close();
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  store.name = els.storeName.value.trim();
  store.whatsapp = sanitizePhone(els.whatsappNumber.value);
  store.tagline = els.storeTagline.value.trim();
  els.whatsappNumber.value = store.whatsapp;
  saveStore();
  renderStoreIdentity();
  showToast("Datos de tienda actualizados.");
}

function handleProductSubmit(event) {
  event.preventDefault();

  const payload = {
    id: editingProductId || crypto.randomUUID(),
    name: els.productName.value.trim(),
    category: els.productCategory.value.trim(),
    price: els.productPrice.value.trim(),
    status: els.productStatus.value,
    image: els.productImage.value.trim(),
    description: els.productDescription.value.trim(),
    featured: els.productFeatured.checked
  };

  if (editingProductId) {
    store.products = store.products.map((product) => (product.id === editingProductId ? payload : product));
    showToast("Producto actualizado.");
  } else {
    store.products.unshift(payload);
    showToast("Producto agregado.");
  }

  saveStore();
  resetProductForm();
  render();
}

function editProduct(productId) {
  const product = store.products.find((item) => item.id === productId);
  if (!product) return;

  editingProductId = product.id;
  els.formTitle.textContent = "Editar producto";
  els.productId.value = product.id;
  els.productName.value = product.name;
  els.productCategory.value = product.category;
  els.productPrice.value = product.price;
  els.productStatus.value = product.status;
  els.productImage.value = product.image;
  els.productDescription.value = product.description;
  els.productFeatured.checked = product.featured;
  els.productName.focus();
}

function deleteProduct(productId) {
  const product = store.products.find((item) => item.id === productId);
  if (!product) return;

  const accepted = confirm(`Eliminar "${product.name}"?`);
  if (!accepted) return;

  store.products = store.products.filter((item) => item.id !== productId);
  saveStore();
  render();
  showToast("Producto eliminado.");
}

function resetProductForm() {
  editingProductId = null;
  els.formTitle.textContent = "Agregar producto";
  els.productForm.reset();
  els.productStatus.value = "Disponible";
}

function buildProductMessage(product) {
  return `Hola, me interesa el producto "${product.name}" (${product.price}). Quisiera saber si est\u00e1 disponible.`;
}

function getWhatsappUrl(message) {
  return `https://wa.me/${sanitizePhone(store.whatsapp)}?text=${encodeURIComponent(message)}`;
}

function sanitizePhone(value) {
  return String(value).replace(/\D/g, "");
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, theme);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 2400);
}

function refreshIcons() {
  document.querySelectorAll("[data-icon]").forEach((icon) => {
    const name = icon.dataset.icon;
    const svg = ICONS[name];
    if (!svg) return;
    icon.innerHTML = svg;
    icon.setAttribute("aria-hidden", "true");
  });
}

const ICONS = {
  "check-circle": '<svg viewBox="0 0 24 24" fill="none"><path d="M8.5 12.4l2.2 2.2 4.8-5.2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="8.5" stroke="currentColor"/></svg>',
  "grid": '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  "lock": '<svg viewBox="0 0 24 24" fill="none"><path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" stroke-linecap="round"/><path d="M6 10h12v10H6V10Z" stroke="currentColor" stroke-linejoin="round"/><path d="M12 14v2" stroke="currentColor" stroke-linecap="round"/></svg>',
  "log-out": '<svg viewBox="0 0 24 24" fill="none"><path d="M10 5H6v14h4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 8l4 4-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 12H9" stroke="currentColor" stroke-linecap="round"/></svg>',
  "message-circle": '<svg viewBox="0 0 32 32" fill="none"><path d="M5.4 27 7 21.4A11.3 11.3 0 1 1 11 25l-5.6 2Z" fill="currentColor"/><path d="M10.8 9.8c.2-.5.5-.6.9-.6h.7c.3 0 .6.1.8.6l.9 2c.2.4.1.8-.2 1.1l-.7.8c.8 1.6 2.1 2.9 3.8 3.8l.8-.8c.3-.3.7-.4 1.1-.2l2 .9c.5.2.6.5.6.9v.6c0 .6-.2.9-.7 1.2-.8.5-2 .7-3.4.2-3.9-1.3-6.9-4.3-8.2-8.2-.5-1.4-.3-2.6.2-3.4Z" fill="var(--wa-mark, #fff)"/></svg>',
  "moon": '<svg viewBox="0 0 24 24" fill="none"><path d="M20 14.2A7.6 7.6 0 0 1 9.8 4a8.1 8.1 0 1 0 10.2 10.2Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  "pencil": '<svg viewBox="0 0 24 24" fill="none"><path d="M4 16.8V20h3.2L18.6 8.6l-3.2-3.2L4 16.8Z" stroke="currentColor" stroke-linejoin="round"/><path d="M14.4 6.4l3.2 3.2" stroke="currentColor" stroke-linecap="round"/></svg>',
  "plus": '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round"/></svg>',
  "save": '<svg viewBox="0 0 24 24" fill="none"><path d="M5 4h11l3 3v13H5V4Z" stroke="currentColor" stroke-linejoin="round"/><path d="M8 4v6h7V4M8 20v-6h8v6" stroke="currentColor" stroke-linejoin="round"/></svg>',
  "search": '<svg viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor"/><path d="M15.5 15.5 20 20" stroke="currentColor" stroke-linecap="round"/></svg>',
  "trash-2": '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M7 7l1 13h8l1-13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  "x": '<svg viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-linecap="round"/></svg>'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

savePassword(getPassword());
init();
