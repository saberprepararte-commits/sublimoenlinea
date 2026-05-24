const STORAGE_KEY = "gallery-store-template-v1";
const THEME_KEY = "gallery-store-theme";
const PROMO_DISMISS_KEY = "sublimo-promo-dismissed";
const FAVORITES_KEY = "sublimo-favorites-v1";
const REACTION_KEY = "sublimo-reaction-v1";
const REACTION_COUNTS_KEY = "sublimo-reaction-counts-v1";
const REACTION_PROMPT_DELAY = 10000;
const REACTION_LATER_DELAY = 24 * 60 * 60 * 1000;
const DEFAULT_REACTION_COUNTS = { like: 350, love: 420 };
const PAGE_SIZE = 24;
const ROULETTE_MIN_DURATION = 3000;
const ROULETTE_MAX_DURATION = 5000;
const PRODUCT_SHUFFLE_INTERVAL = 8 * 60 * 60 * 1000;
const PRODUCT_SIZE_GROUPS = [
  { label: "Niños y niñas", values: ["2-4", "6-8", "10-12", "14-16"] },
  { label: "Adultos", values: ["S", "M", "L", "XL"] }
];
const PRODUCT_COLORS = ["Negro", "Blanco", "Rojo", "Verde", "Azul", "Amarillo", "Rosado", "Mostaza", "Otro"];
const PRODUCT_FABRIC = "Algodón 94% y elastano 6%";
const VISUAL_THEMES = [
  { id: "urbano", label: "Urbano" },
  { id: "dulce", label: "Dulce" },
  { id: "minimal", label: "Minimal" },
  { id: "neon", label: "Ne\u00f3n" }
];

const starterProducts = [
  {
    id: "camiseta-basica",
    name: "Camiseta básica Sublimo",
    category: "Camiseta",
    price: "$ 45.000",
    status: "Disponible",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    description: "Camiseta básica para estampados personalizados, cómoda y de alta calidad.",
    featured: true
  },
  {
    id: "camiseta-dallas",
    name: "Camiseta estampada Dallas",
    category: "Camiseta",
    price: "$ 58.000",
    status: "Disponible",
    image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=900&q=80",
    description: "Diseño estampado sobre camiseta blanca, ideal para un look urbano.",
    featured: true
  },
  {
    id: "set-ceramica",
    name: "Set cer\u00e1mica Nube",
    category: "Hogar",
    price: "$ 120.000",
    status: "Disponible",
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80",
    description: "Piezas esmaltadas para mesa, disponibles en tonos claros y acabado mate.",
    featured: false
  },
  {
    id: "camisa-lino",
    name: "Camisa lino Oliva",
    category: "Ropa",
    price: "$ 145.000",
    status: "Por encargo",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
    description: "Camisa fresca de corte relajado, ideal para clima cálido y uso diario.",
    featured: false
  },
  {
    id: "vela-botanica",
    name: "Vela Botánica",
    category: "Decoraci\u00f3n",
    price: "$ 42.000",
    status: "Disponible",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80",
    description: "Aroma suave con notas herbales, vaso reutilizable y cera vegetal.",
    featured: false
  }
];

let store = loadStore();
let visibleProductCount = PAGE_SIZE;
let productShuffleSeed = Date.now();
let productShuffleTimerId = null;
let favoriteProductIds = loadFavoriteProductIds();
let showingFavoritesOnly = false;
let currentQuickViewProduct = null;
let selectedQuickViewOptions = { size: "", color: "" };
let rouletteState = {
  product: null,
  hasResult: false,
  spinning: false,
  intervalId: null,
  timeoutId: null,
  poolKey: ""
};

const els = {
  storeNameLabel: document.querySelector("#storeNameLabel"),
  storeTaglineLabel: document.querySelector("#storeTaglineLabel"),
  footerStoreName: document.querySelector("#footerStoreName"),
  heroWhatsapp: document.querySelector("#heroWhatsapp"),
  promoBanner: document.querySelector("#promoBanner"),
  promoClose: document.querySelector("#promoClose"),
  promoPrev: document.querySelector("#promoPrev"),
  promoNext: document.querySelector("#promoNext"),
  promoProducts: document.querySelector("#promoProducts"),
  promoWhatsapp: document.querySelector("#promoWhatsapp"),
  productGrid: document.querySelector("#productGrid"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  sortFilter: document.querySelector("#sortFilter"),
  categoryChips: document.querySelector("#categoryChips"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  resultCount: document.querySelector("#resultCount"),
  toast: document.querySelector("#toast"),
  quickView: document.querySelector("#quickView"),
  quickViewImage: document.querySelector("#quickViewImage"),
  quickViewCategory: document.querySelector("#quickViewCategory"),
  quickViewStatus: document.querySelector("#quickViewStatus"),
  quickViewTitle: document.querySelector("#quickViewTitle"),
  quickViewDescription: document.querySelector("#quickViewDescription"),
  quickViewPrice: document.querySelector("#quickViewPrice"),
  quickViewSizes: document.querySelector("#quickViewSizes"),
  quickViewColors: document.querySelector("#quickViewColors"),
  quickViewFabric: document.querySelector("#quickViewFabric"),
  quickViewWhatsapp: document.querySelector("#quickViewWhatsapp"),
  quickViewFavorite: document.querySelector("#quickViewFavorite"),
  favoritesToggle: document.querySelector("#favoritesToggle"),
  favoritesCount: document.querySelector("#favoritesCount"),
  themeToggle: document.querySelector("#themeToggle"),
  themeLabel: document.querySelector("#themeLabel"),
  reactionPrompt: document.querySelector("#reactionPrompt"),
  reactionFeedback: document.querySelector("#reactionFeedback"),
  reactionStats: document.querySelector("#reactionStats")
};

function loadStore() {
  const defaults = {
    name: "Sublimo Shop",
    tagline: "Productos seleccionados",
    whatsapp: "573126611414",
    products: starterProducts
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return defaults;
    return {
      ...defaults,
      name: stored.name || defaults.name,
      tagline: stored.tagline || defaults.tagline,
      whatsapp: stored.whatsapp || defaults.whatsapp,
      products: Array.isArray(stored.products) && stored.products.length ? stored.products : defaults.products
    };
  } catch {
    return defaults;
  }
}

async function init() {
  applyVisualTheme(getInitialVisualTheme());

  await loadProductsFromSupabase();
  await loadSettingsFromSupabase();
  renderStoreIdentity();
  renderPromoBanner();
  renderCategories();
  renderProducts();
  bindEvents();
  startProductShuffle();
  scheduleReactionPrompt();
  refreshIcons();
}

async function loadSettingsFromSupabase() {
  const config = window.SUBLIMO_SUPABASE;
  if (!config?.url || !config?.anonKey) return;

  const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/store_settings?select=name,tagline,whatsapp&id=eq.main`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`
      }
    });

    if (!response.ok) throw new Error(`Supabase respondi\u00f3 ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data) || !data[0]) return;

    store = {
      ...store,
      name: data[0].name || store.name,
      tagline: data[0].tagline || store.tagline,
      whatsapp: data[0].whatsapp || store.whatsapp
    };
  } catch (error) {
    console.warn("No se pudieron cargar los datos de la tienda desde Supabase.", error);
  }
}

async function loadProductsFromSupabase() {
  const config = window.SUBLIMO_SUPABASE;
  if (!config?.url || !config?.anonKey) return;

  const endpoint = [
    `${config.url.replace(/\/$/, "")}/rest/v1/products`,
    "?select=id,name,category,price,status,image,description,featured,created_at",
    "&order=created_at.desc"
  ].join("");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`
      }
    });

    if (!response.ok) throw new Error(`Supabase respondi\u00f3 ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) return;

    store = {
      ...store,
      products: data.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        status: product.status,
        image: normalizeImageUrl(product.image),
        description: product.description,
        featured: product.featured
      }))
    };
  } catch (error) {
    console.warn("No se pudieron cargar productos desde Supabase.", error);
  }
}

function bindEvents() {
  els.searchInput?.addEventListener("input", resetProductView);
  els.categoryFilter?.addEventListener("change", resetProductView);
  els.sortFilter?.addEventListener("change", resetProductView);
  els.favoritesToggle?.addEventListener("click", toggleFavoritesView);
  els.quickViewFavorite?.addEventListener("click", () => {
    if (currentQuickViewProduct) toggleFavorite(currentQuickViewProduct);
  });
  els.loadMoreButton?.addEventListener("click", showMoreProducts);
  els.promoClose?.addEventListener("click", closePromoBanner);
  els.promoPrev?.addEventListener("click", () => scrollPromoProducts(-1));
  els.promoNext?.addEventListener("click", () => scrollPromoProducts(1));
  document.querySelectorAll("[data-close-quick-view]").forEach((control) => {
    control.addEventListener("click", closeQuickView);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeQuickView();
  });
  els.themeToggle?.addEventListener("click", toggleTheme);
  els.heroWhatsapp?.addEventListener("click", () => {
    window.open(getWhatsappUrl(`Hola, deseo recibir informaci\u00f3n de ${store.name}.`), "_blank");
  });
  document.querySelectorAll("[data-reaction]").forEach((button) => {
    button.addEventListener("click", () => handleReaction(button.dataset.reaction));
  });
  document.querySelectorAll("[data-reaction-close]").forEach((control) => {
    control.addEventListener("click", closeReactionPrompt);
  });
}

function getFeaturedProducts() {
  return store.products.filter((product) => product.featured).slice(0, 12);
}

function getPromoKey(products) {
  return products.map((product) => product.id).join("|");
}

function renderPromoBanner() {
  if (!els.promoBanner || !els.promoProducts || !els.promoWhatsapp) return;

  const featuredProducts = getFeaturedProducts();
  const promoKey = getPromoKey(featuredProducts);
  const dismissedKey = localStorage.getItem(PROMO_DISMISS_KEY);

  if (!featuredProducts.length || dismissedKey === promoKey) {
    els.promoBanner.hidden = true;
    return;
  }

  els.promoBanner.classList.toggle("is-single", featuredProducts.length === 1);
  els.promoBanner.classList.toggle("has-carousel", featuredProducts.length > 3);
  if (els.promoPrev) els.promoPrev.hidden = featuredProducts.length <= 3;
  if (els.promoNext) els.promoNext.hidden = featuredProducts.length <= 3;
  els.promoProducts.innerHTML = "";
  featuredProducts.forEach((product) => {
    const item = document.createElement("article");
    item.className = "promo-product";
    item.innerHTML = `
      <img src="${escapeAttribute(normalizeImageUrl(product.image))}" alt="${escapeAttribute(product.name)}" loading="lazy">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <span>${escapeHtml(formatPrice(product.price))}</span>
        <a class="promo-whatsapp-button" href="${getWhatsappUrl(buildPromoProductMessage(product))}" target="_blank" rel="noopener" aria-label="Consultar ${escapeAttribute(product.name)} por WhatsApp" title="Consultar por WhatsApp">
          <span data-icon="message-circle"></span>
          WhatsApp
        </a>
      </div>
    `;
    els.promoProducts.append(item);
  });

  const names = featuredProducts.map((product) => product.name).join(", ");
  els.promoWhatsapp.href = getWhatsappUrl(`Hola, quiero consultar la promoci\u00f3n de estas camisetas: ${names}.`);
  els.promoBanner.dataset.promoKey = promoKey;
  els.promoBanner.hidden = false;
  refreshIcons();
}

function scrollPromoProducts(direction) {
  if (!els.promoProducts) return;
  const distance = Math.max(els.promoProducts.clientWidth * 0.85, 260);
  els.promoProducts.scrollBy({ left: distance * direction, behavior: "smooth" });
}

function closePromoBanner() {
  const promoKey = els.promoBanner?.dataset.promoKey || "";
  if (promoKey) localStorage.setItem(PROMO_DISMISS_KEY, promoKey);
  if (els.promoBanner) els.promoBanner.hidden = true;
}

function resetProductView() {
  visibleProductCount = PAGE_SIZE;
  clearRouletteTimers();
  rouletteState.product = null;
  rouletteState.hasResult = false;
  rouletteState.poolKey = "";
  renderProducts();
  syncCategoryChips();
}

function showMoreProducts() {
  visibleProductCount += PAGE_SIZE;
  renderProducts();
}

function renderStoreIdentity() {
  if (els.storeNameLabel) els.storeNameLabel.textContent = store.name;
  if (els.footerStoreName) els.footerStoreName.textContent = store.name;
  if (els.storeTaglineLabel) els.storeTaglineLabel.textContent = store.tagline;
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
  renderCategoryChips(categories);
}

function renderCategoryChips(categories) {
  if (!els.categoryChips) return;

  const selected = els.categoryFilter.value || "all";
  const chipCategories = ["all", ...categories.slice(0, 10)];
  els.categoryChips.innerHTML = "";

  chipCategories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-chip";
    button.textContent = category === "all" ? "Todas" : category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(category === selected));
    button.addEventListener("click", () => {
      els.categoryFilter.value = category;
      resetProductView();
      syncCategoryChips();
    });
    els.categoryChips.append(button);
  });
}

function syncCategoryChips() {
  if (!els.categoryChips) return;
  const selected = els.categoryFilter.value || "all";
  els.categoryChips.querySelectorAll(".category-chip").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.category === selected));
  });
}

function renderProducts() {
  const term = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const sortedProducts = sortProducts(store.products.filter((product) => {
    const matchesText = [product.name, product.category, product.description, product.price]
      .join(" ")
      .toLowerCase()
      .includes(term);
    const matchesCategory = category === "all" || product.category === category;
    const matchesFavorite = !showingFavoritesOnly || favoriteProductIds.has(getProductKey(product));
    return matchesText && matchesCategory && matchesFavorite;
  }));
  const products = shouldAutoShuffleProducts() ? shuffleProducts(sortedProducts, productShuffleSeed) : sortedProducts;

  els.productGrid.innerHTML = "";
  els.emptyState.hidden = products.length > 0;
  els.emptyState.textContent = showingFavoritesOnly
    ? "A\u00fan no tienes productos favoritos."
    : "No hay productos para mostrar.";
  const visibleProducts = products.slice(0, visibleProductCount);

  if (products.length) {
    els.productGrid.append(createRouletteCard(products));
  }

  visibleProducts.forEach((product) => {
    const isSaved = isFavorite(product);
    const card = document.createElement("article");
    card.className = "product-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Ver detalles de ${product.name}`);
    card.innerHTML = `
      <div class="product-image">
        <img src="${escapeAttribute(normalizeImageUrl(product.image))}" alt="${escapeAttribute(product.name)}" loading="lazy">
        <span class="badge">${escapeHtml(product.featured ? "Destacado" : product.status)}</span>
        <button class="favorite-button" type="button" aria-label="${isSaved ? "Quitar de favoritos" : "Guardar en favoritos"}" aria-pressed="${String(isSaved)}" title="${isSaved ? "Quitar de favoritos" : "Guardar en favoritos"}">
          <span data-icon="heart"></span>
        </button>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span>${escapeHtml(product.category)}</span>
          <span>${escapeHtml(product.status)}</span>
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-footer">
          <span class="price">${escapeHtml(formatPrice(product.price))}</span>
          <a class="whatsapp-button" href="${getWhatsappUrl(buildProductMessage(product))}" target="_blank" rel="noopener" aria-label="Consultar ${escapeAttribute(product.name)} por WhatsApp" title="Consultar por WhatsApp">
            <span data-icon="message-circle"></span>
          </a>
        </div>
      </div>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      openQuickView(product);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openQuickView(product);
      }
    });
    card.querySelector(".favorite-button")?.addEventListener("click", () => toggleFavorite(product));
    els.productGrid.append(card);
  });

  if (els.loadMoreButton) {
    els.loadMoreButton.hidden = visibleProductCount >= products.length;
  }
  if (els.resultCount) {
    els.resultCount.textContent = products.length
      ? `Mostrando ${Math.min(visibleProductCount, products.length)} de ${products.length} productos`
      : "";
  }

  updateFavoriteControls();
  refreshIcons();
}

function createRouletteCard(products) {
  const poolKey = products.map((product) => product.id || product.name).sort().join("|");
  if (rouletteState.poolKey !== poolKey) {
    rouletteState.poolKey = poolKey;
    rouletteState.product = products[0];
    rouletteState.hasResult = false;
    clearRouletteTimers();
  }

  const currentProduct = rouletteState.product || products[0];
  const hasResult = rouletteState.hasResult && !rouletteState.spinning;
  const card = document.createElement("article");
  card.className = `product-card roulette-card${rouletteState.spinning ? " is-spinning" : ""}`;
  card.setAttribute("aria-live", "polite");
  card.innerHTML = `
    <div class="product-image roulette-image">
      <img src="${escapeAttribute(normalizeImageUrl(currentProduct.image))}" alt="${escapeAttribute(currentProduct.name)}" loading="lazy">
      <span class="badge">${escapeHtml(rouletteState.spinning ? "Girando" : "Sorpresa")}</span>
      <div class="roulette-orbit" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <div class="product-body">
      <div class="product-meta">
        <span>${escapeHtml(rouletteState.spinning ? "Ruleta Sublimo" : currentProduct.category)}</span>
        <span>${escapeHtml(rouletteState.spinning ? "Eligiendo..." : currentProduct.status)}</span>
      </div>
      <h3>${escapeHtml(rouletteState.spinning || hasResult ? currentProduct.name : "Descubre tu camiseta")}</h3>
      <p>${escapeHtml(rouletteState.spinning ? "Estamos mezclando las opciones de la galería." : hasResult ? "Esta fue la camiseta elegida por la ruleta. Puedes ver el detalle o consultarla por WhatsApp." : "Presiona jugar y deja que la tienda elija una camiseta al azar para ti.")}</p>
      <div class="product-footer roulette-footer">
        <span class="price">${escapeHtml(rouletteState.spinning ? "3 a 5 segundos" : hasResult ? formatPrice(currentProduct.price) : "Juego aleatorio")}</span>
        <button class="roulette-button" type="button" ${rouletteState.spinning ? "disabled" : ""}>
          <span data-icon="${rouletteState.spinning ? "sparkles" : "shuffle"}"></span>
          ${rouletteState.spinning ? "Girando..." : hasResult ? "Jugar otra vez" : "Jugar"}
        </button>
      </div>
      <div class="roulette-result"${!hasResult ? " hidden" : ""}>
        <button class="ghost-button roulette-detail" type="button">
          <span data-icon="eye"></span>
          Ver detalle
        </button>
        <a class="whatsapp-button roulette-whatsapp" href="${getWhatsappUrl(buildRouletteMessage(currentProduct))}" target="_blank" rel="noopener" aria-label="Consultar ${escapeAttribute(currentProduct.name)} por WhatsApp" title="Consultar por WhatsApp">
          <span data-icon="message-circle"></span>
        </a>
      </div>
    </div>
  `;

  card.querySelector(".roulette-button")?.addEventListener("click", () => startRoulette(products));
  card.querySelector(".roulette-detail")?.addEventListener("click", () => openQuickView(currentProduct));
  return card;
}

function startRoulette(products) {
  if (!products.length || rouletteState.spinning) return;

  clearRouletteTimers();
  rouletteState.spinning = true;
  rouletteState.hasResult = false;
  let index = Math.floor(Math.random() * products.length);
  rouletteState.product = products[index];
  renderProducts();

  rouletteState.intervalId = window.setInterval(() => {
    index = (index + 1 + Math.floor(Math.random() * Math.max(1, products.length - 1))) % products.length;
    rouletteState.product = products[index];
    renderProducts();
  }, 95);

  const duration = ROULETTE_MIN_DURATION + Math.random() * (ROULETTE_MAX_DURATION - ROULETTE_MIN_DURATION);
  rouletteState.timeoutId = window.setTimeout(() => {
    clearRouletteTimers();
    rouletteState.spinning = false;
    rouletteState.hasResult = true;
    rouletteState.product = products[Math.floor(Math.random() * products.length)];
    renderProducts();
  }, duration);
}

function clearRouletteTimers() {
  if (rouletteState.intervalId) window.clearInterval(rouletteState.intervalId);
  if (rouletteState.timeoutId) window.clearTimeout(rouletteState.timeoutId);
  rouletteState.intervalId = null;
  rouletteState.timeoutId = null;
  rouletteState.spinning = false;
}

function startProductShuffle() {
  if (productShuffleTimerId) window.clearInterval(productShuffleTimerId);
  productShuffleTimerId = window.setInterval(() => {
    if (document.hidden || rouletteState.spinning || store.products.length < 3) return;
    productShuffleSeed = Date.now();
    renderProducts();
  }, PRODUCT_SHUFFLE_INTERVAL);
}

function shuffleProducts(products, seed) {
  const shuffled = [...products];
  let state = Math.abs(Math.floor(seed)) || 1;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function shouldAutoShuffleProducts() {
  const sortValue = els.sortFilter?.value || "recent";
  return sortValue === "recent" || sortValue === "featured";
}

function openQuickView(product) {
  if (!els.quickView) return;

  currentQuickViewProduct = product;
  selectedQuickViewOptions = { size: "", color: "" };
  const imageUrl = normalizeImageUrl(product.image);
  els.quickViewImage.src = imageUrl;
  els.quickViewImage.alt = product.name;
  els.quickViewCategory.textContent = product.category;
  els.quickViewStatus.textContent = product.status;
  els.quickViewTitle.textContent = product.name;
  els.quickViewDescription.textContent = product.description;
  els.quickViewPrice.textContent = formatPrice(product.price);
  renderQuickViewDetails();
  updateQuickViewWhatsappLink();
  updateQuickViewFavoriteButton(product);
  els.quickView.hidden = false;
  document.body.classList.add("quick-view-open");
  refreshIcons();
}

function closeQuickView() {
  if (!els.quickView || els.quickView.hidden) return;
  els.quickView.hidden = true;
  currentQuickViewProduct = null;
  selectedQuickViewOptions = { size: "", color: "" };
  document.body.classList.remove("quick-view-open");
}

function loadFavoriteProductIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveFavoriteProductIds() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteProductIds]));
}

function getProductKey(product) {
  return String(product.id || `${product.name}-${product.image}`);
}

function isFavorite(product) {
  return favoriteProductIds.has(getProductKey(product));
}

function toggleFavorite(product) {
  const key = getProductKey(product);
  const willSave = !favoriteProductIds.has(key);

  if (willSave) {
    favoriteProductIds.add(key);
    showToast("Producto guardado en favoritos.");
  } else {
    favoriteProductIds.delete(key);
    showToast("Producto eliminado de favoritos.");
  }

  saveFavoriteProductIds();
  renderProducts();
  if (currentQuickViewProduct) {
    updateQuickViewFavoriteButton(currentQuickViewProduct);
    refreshIcons();
  }
}

function toggleFavoritesView() {
  showingFavoritesOnly = !showingFavoritesOnly;
  resetProductView();
}

function getAvailableFavoriteCount() {
  const availableKeys = new Set(store.products.map(getProductKey));
  return [...favoriteProductIds].filter((key) => availableKeys.has(key)).length;
}

function updateFavoriteControls() {
  const count = getAvailableFavoriteCount();
  if (els.favoritesCount) els.favoritesCount.textContent = String(count);
  if (els.favoritesToggle) {
    els.favoritesToggle.setAttribute("aria-pressed", String(showingFavoritesOnly));
    els.favoritesToggle.classList.toggle("is-active", showingFavoritesOnly);
  }
}

function updateQuickViewFavoriteButton(product) {
  if (!els.quickViewFavorite) return;
  const saved = isFavorite(product);
  els.quickViewFavorite.setAttribute("aria-pressed", String(saved));
  els.quickViewFavorite.classList.toggle("is-active", saved);
  els.quickViewFavorite.innerHTML = `
    <span data-icon="heart"></span>
    ${saved ? "Guardado en favoritos" : "Guardar en favoritos"}
  `;
}

function renderQuickViewDetails() {
  if (els.quickViewSizes) {
    els.quickViewSizes.innerHTML = PRODUCT_SIZE_GROUPS.map((group) => `
      <span class="detail-group-label">${escapeHtml(group.label)}</span>
      ${group.values.map((size) => `
        <button class="detail-chip" type="button" data-detail-type="size" data-detail-value="${escapeAttribute(size)}" aria-pressed="false">
          ${escapeHtml(size)}
        </button>
      `).join("")}
    `).join("");
  }

  if (els.quickViewColors) {
    els.quickViewColors.innerHTML = PRODUCT_COLORS.map((color) => `
      <button class="detail-chip color-chip" type="button" style="--swatch:${getColorSwatch(color)}" data-detail-type="color" data-detail-value="${escapeAttribute(color)}" aria-pressed="false">
        <span aria-hidden="true"></span>
        ${escapeHtml(color)}
      </button>
    `).join("");
  }

  els.quickViewSizes?.querySelectorAll("[data-detail-type]").forEach((button) => {
    button.addEventListener("click", () => selectQuickViewOption(button));
  });
  els.quickViewColors?.querySelectorAll("[data-detail-type]").forEach((button) => {
    button.addEventListener("click", () => selectQuickViewOption(button));
  });

  if (els.quickViewFabric) {
    els.quickViewFabric.textContent = PRODUCT_FABRIC;
  }
}

function selectQuickViewOption(button) {
  const type = button.dataset.detailType;
  const value = button.dataset.detailValue || "";
  if (!type || !value) return;

  selectedQuickViewOptions[type] = selectedQuickViewOptions[type] === value ? "" : value;
  syncQuickViewOptionButtons(type);
  updateQuickViewWhatsappLink();
}

function syncQuickViewOptionButtons(type) {
  const selected = selectedQuickViewOptions[type] || "";
  document.querySelectorAll(`[data-detail-type="${type}"]`).forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.detailValue === selected));
  });
}

function updateQuickViewWhatsappLink() {
  if (!currentQuickViewProduct || !els.quickViewWhatsapp) return;
  els.quickViewWhatsapp.href = getWhatsappUrl(buildProductMessage(currentQuickViewProduct, selectedQuickViewOptions));
}

function getColorSwatch(color) {
  const swatches = {
    Negro: "#111111",
    Blanco: "#ffffff",
    Rojo: "#d83a32",
    Verde: "#2f8f58",
    Azul: "#2563eb",
    Amarillo: "#f7c948",
    Rosado: "#f5a6c8",
    Mostaza: "#c8961f",
    Otro: "linear-gradient(135deg, #111 0 25%, #fff 25% 50%, #2f8f58 50% 75%, #f5a6c8 75% 100%)"
  };
  return swatches[color] || "#dddddd";
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 2400);
}

function scheduleReactionPrompt() {
  if (!els.reactionPrompt || !shouldShowReactionPrompt()) return;
  window.setTimeout(() => {
    if (shouldShowReactionPrompt()) openReactionPrompt();
  }, REACTION_PROMPT_DELAY);
}

function shouldShowReactionPrompt() {
  try {
    const saved = JSON.parse(localStorage.getItem(REACTION_KEY));
    if (!saved) return true;
    if (saved.reaction === "later") return Date.now() >= Number(saved.nextPromptAt || 0);
    return false;
  } catch {
    return true;
  }
}

async function openReactionPrompt() {
  els.reactionPrompt.hidden = false;
  document.body.classList.add("reaction-open");
  await updateReactionStats();
  refreshIcons();
}

function closeReactionPrompt() {
  if (!els.reactionPrompt || els.reactionPrompt.hidden) return;
  els.reactionPrompt.hidden = true;
  document.body.classList.remove("reaction-open");
}

async function handleReaction(reaction) {
  if (!reaction) return;

  if (reaction === "later") {
    localStorage.setItem(REACTION_KEY, JSON.stringify({
      reaction: "later",
      nextPromptAt: Date.now() + REACTION_LATER_DELAY
    }));
    showReactionFeedback("Esperamos que disfrutes la experiencia. Te volveremos a preguntar m\u00e1s adelante.");
    window.setTimeout(closeReactionPrompt, 2200);
    return;
  }

  const message = reaction === "love"
    ? "Nos encanta que te encante. Gracias por apoyar a Sublimo."
    : "Gracias por tu apoyo. Tu reacci\u00f3n nos ayuda a mejorar.";

  const saved = await saveReactionToSupabase(reaction);
  if (!saved) {
    showReactionFeedback("A\u00fan no pudimos guardar tu reacci\u00f3n. Falta activar el contador en Supabase.");
    await updateReactionStats();
    return;
  }

  localStorage.setItem(REACTION_KEY, JSON.stringify({ reaction, createdAt: Date.now() }));
  showReactionFeedback(message, true);
  await updateReactionStats();
  window.setTimeout(closeReactionPrompt, 2600);
}

function showReactionFeedback(message, celebrate = false) {
  if (!els.reactionFeedback) return;
  els.reactionFeedback.textContent = message;
  els.reactionFeedback.classList.toggle("is-celebrating", celebrate);
}

async function updateReactionStats() {
  if (!els.reactionStats) return;
  const counts = await getReactionCounts();
  const total = (counts.like || 0) + (counts.love || 0);
  els.reactionStats.textContent = total
    ? `${total.toLocaleString("es-CO")} personas han reaccionado a Sublimo.`
    : "Tu reacci\u00f3n ayuda a mejorar la experiencia.";
}

async function saveReactionToSupabase(reaction) {
  const config = window.SUBLIMO_SUPABASE;
  if (!config?.url || !config?.anonKey) {
    saveReactionLocally(reaction);
    return true;
  }

  const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/rpc/increment_reaction_count`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reaction_name: reaction })
    });

    if (!response.ok) throw new Error(`Supabase respondi\u00f3 ${response.status}`);

    const data = await response.json();
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.reaction && Number.isFinite(Number(row.total))) {
      const counts = getLocalReactionCounts();
      counts[row.reaction] = Number(row.total);
      localStorage.setItem(REACTION_COUNTS_KEY, JSON.stringify(counts));
      return true;
    }
    return false;
  } catch (error) {
    console.warn("No se pudo guardar la reacci\u00f3n en Supabase.", error);
    return false;
  }
}

async function getReactionCounts() {
  const config = window.SUBLIMO_SUPABASE;
  if (!config?.url || !config?.anonKey) return getLocalReactionCounts();

  const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/reaction_counts?select=reaction,total`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`
      }
    });

    if (!response.ok) throw new Error(`Supabase respondi\u00f3 ${response.status}`);

    const data = await response.json();
    const counts = { ...DEFAULT_REACTION_COUNTS };
    data.forEach((row) => {
      if (row.reaction === "like" || row.reaction === "love") {
        counts[row.reaction] = Number(row.total) || 0;
      }
    });
    localStorage.setItem(REACTION_COUNTS_KEY, JSON.stringify(counts));
    return counts;
  } catch (error) {
    console.warn("No se pudieron cargar las reacciones desde Supabase.", error);
    return getLocalReactionCounts();
  }
}

function saveReactionLocally(reaction) {
  const counts = getLocalReactionCounts();
  counts[reaction] = (counts[reaction] || 0) + 1;
  localStorage.setItem(REACTION_COUNTS_KEY, JSON.stringify(counts));
}

function getLocalReactionCounts() {
  try {
    return { ...DEFAULT_REACTION_COUNTS, ...JSON.parse(localStorage.getItem(REACTION_COUNTS_KEY)) };
  } catch {
    return { ...DEFAULT_REACTION_COUNTS };
  }
}

function sortProducts(products) {
  const sortValue = els.sortFilter?.value || "recent";
  return [...products].sort((a, b) => {
    if (sortValue === "featured") return Number(b.featured) - Number(a.featured);
    if (sortValue === "price-asc") return getPriceNumber(a.price) - getPriceNumber(b.price);
    if (sortValue === "price-desc") return getPriceNumber(b.price) - getPriceNumber(a.price);
    if (sortValue === "name") return String(a.name).localeCompare(String(b.name), "es");
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

function buildProductMessage(product, options = {}) {
  return buildProductInquiryMessage(
    product,
    `Hola, me interesa este producto de ${store.name}:`,
    options
  );
}

function buildPromoProductMessage(product) {
  return buildProductInquiryMessage(
    product,
    "Hola, vi esta camiseta en la promoci\u00f3n destacada y me interesa comprarla:"
  );
}

function buildRouletteMessage(product) {
  return buildProductInquiryMessage(
    product,
    "Hola, jugu\u00e9 la ruleta de Sublimo y me sali\u00f3 esta camiseta:"
  );
}

function buildProductInquiryMessage(product, intro, options = {}) {
  const lines = [
    intro,
    "",
    `Producto: ${product.name}`
  ];

  if (options.size) lines.push(`Talla elegida: ${options.size}`);
  if (options.color) lines.push(`Color elegido: ${options.color}`);

  lines.push(
    `Precio: ${formatPrice(product.price)}`,
    `Categor\u00eda: ${product.category}`,
    `Estado: ${product.status}`,
    `Tela: ${PRODUCT_FABRIC}`
  );

  const imageUrl = normalizeImageUrl(product.image);
  if (imageUrl) {
    lines.push(`Imagen: ${imageUrl}`);
  }

  lines.push("", "Quisiera saber si est\u00e1 disponible.");
  return lines.join("\n");
}

function getWhatsappUrl(message) {
  return `https://wa.me/${sanitizePhone(store.whatsapp)}?text=${encodeURIComponent(message)}`;
}

function sanitizePhone(value) {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  return digits;
}

function formatPrice(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return String(value || "");
  return `$${Number(digits).toLocaleString("es-CO")}`;
}

function getPriceNumber(value) {
  return Number(String(value || "").replace(/\D/g, "")) || 0;
}

function normalizeImageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (driveMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveMatch[1])}&sz=w1200`;
  }

  return url;
}

function toggleTheme() {
  const current = document.documentElement.dataset.style || VISUAL_THEMES[0].id;
  const currentIndex = VISUAL_THEMES.findIndex((theme) => theme.id === current);
  const nextTheme = VISUAL_THEMES[(currentIndex + 1) % VISUAL_THEMES.length];
  applyVisualTheme(nextTheme.id);
  localStorage.setItem(THEME_KEY, nextTheme.id);
}

function getInitialVisualTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark") return "urbano";
  if (VISUAL_THEMES.some((theme) => theme.id === stored)) return stored;
  return "urbano";
}

function applyVisualTheme(themeId) {
  const theme = VISUAL_THEMES.find((item) => item.id === themeId) || VISUAL_THEMES[0];
  document.documentElement.classList.remove("dark");
  document.documentElement.dataset.style = theme.id;
  if (els.themeLabel) els.themeLabel.textContent = theme.label;
  if (els.themeToggle) {
    els.themeToggle.setAttribute("aria-label", `Cambiar estilo visual. Actual: ${theme.label}`);
    els.themeToggle.title = `Switch: ${theme.label}`;
  }
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

const ICONS = {
  "grid": '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  "chevron-left": '<svg viewBox="0 0 24 24" fill="none"><path d="m15 6-6 6 6 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  "chevron-right": '<svg viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  "message-circle": '<svg viewBox="0 0 32 32" fill="none"><path d="M5.4 27 7 21.4A11.3 11.3 0 1 1 11 25l-5.6 2Z" fill="currentColor"/><path d="M10.8 9.8c.2-.5.5-.6.9-.6h.7c.3 0 .6.1.8.6l.9 2c.2.4.1.8-.2 1.1l-.7.8c.8 1.6 2.1 2.9 3.8 3.8l.8-.8c.3-.3.7-.4 1.1-.2l2 .9c.5.2.6.5.6.9v.6c0 .6-.2.9-.7 1.2-.8.5-2 .7-3.4.2-3.9-1.3-6.9-4.3-8.2-8.2-.5-1.4-.3-2.6.2-3.4Z" fill="var(--wa-mark, #fff)"/></svg>',
  "moon": '<svg viewBox="0 0 24 24" fill="none"><path d="M20 14.2A7.6 7.6 0 0 1 9.8 4a8.1 8.1 0 1 0 10.2 10.2Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  "palette": '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4a8 8 0 0 0-2.7 15.5c.8.3 1.4-.4 1.2-1.2-.2-.8.4-1.3 1.2-1.3h1.8A6.5 6.5 0 0 0 20 10.5C20 6.9 16.4 4 12 4Z" stroke="currentColor" stroke-linejoin="round"/><path d="M7.8 11.2h.1M10.2 8.2h.1M14.2 8.2h.1M16.4 11.2h.1" stroke="currentColor" stroke-linecap="round"/></svg>',
  "search": '<svg viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor"/><path d="M15.5 15.5 20 20" stroke="currentColor" stroke-linecap="round"/></svg>',
  "shuffle": '<svg viewBox="0 0 24 24" fill="none"><path d="M18 4h3v3M3 7h3.6c2 0 3 1 4.2 3.2l2.4 4.6C14.4 17 15.4 18 17.4 18H21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 20h3v-3M3 18h3.6c1.6 0 2.6-.7 3.5-2.1M14.1 8.1C15 7.4 16 7 17.4 7H21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  "sparkles": '<svg viewBox="0 0 24 24" fill="none"><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14ZM5 13l.8 1.8L8 15.5l-2.2.7L5 18l-.8-1.8-2.2-.7 2.2-.7L5 13Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  "eye": '<svg viewBox="0 0 24 24" fill="none"><path d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z" stroke="currentColor" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.6" stroke="currentColor"/></svg>',
  "heart": '<svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.2-9.2-9A4.7 4.7 0 0 1 11 6.4l1 1 1-1A4.7 4.7 0 0 1 21.2 11C19 15.8 12 20 12 20Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  "thumbs-up": '<svg viewBox="0 0 24 24" fill="none"><path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Zm0 0 4.2-6.4c.8-1.2 2.7-.6 2.7.9V9h4.2a2 2 0 0 1 1.9 2.5l-1.5 6A3.3 3.3 0 0 1 15.3 20H7V10Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  "x": '<svg viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-linecap="round"/></svg>'
};

init();
