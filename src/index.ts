type Product = { id: string; name: string; category: "Dogs" | "Cats" | "Everyday"; price: number; description: string; icon: string; color: string };
type CartItem = Product & { quantity: number };

const fallbackProducts: Product[] = [
  { id: "cloud-bed", name: "Cloud Nap Bed", category: "Dogs", price: 68, description: "A washable, supportive bed for excellent naps.", icon: "☁️", color: "#dbe9df" },
  { id: "mouse-toy", name: "Wool Mouse Duo", category: "Cats", price: 14, description: "Soft, natural-wool toys made for curious paws.", icon: "🐭", color: "#f4dfcf" },
  { id: "walk-set", name: "Everyday Walk Set", category: "Dogs", price: 42, description: "A comfortable leash and harness for daily adventures.", icon: "🦮", color: "#d9e4ee" },
  { id: "slow-bowl", name: "Calm Eating Bowl", category: "Everyday", price: 24, description: "A non-slip bowl that helps pets eat at an easy pace.", icon: "🥣", color: "#eee4cb" },
  { id: "groom-brush", name: "Gentle Groom Brush", category: "Everyday", price: 18, description: "Rounded bristles for a calm, comfortable groom.", icon: "🪮", color: "#e3dced" },
  { id: "treat-pouch", name: "Pocket Treat Pouch", category: "Dogs", price: 22, description: "A neat, washable pouch for training and walks.", icon: "🦴", color: "#ead9d2" }
];
let products: Product[] = fallbackProducts;

class ApiClient {
  constructor(private readonly baseUrl: string) {}
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`API request failed with ${response.status}`);
    return response.json() as Promise<T>;
  }
  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`API request failed with ${response.status}`);
    return response.json() as Promise<T>;
  }
}

class StorefrontService {
  private readonly productsApi = new ApiClient("http://localhost:4002");
  private readonly paymentsApi = new ApiClient("http://localhost:4003");
  async loadProducts(): Promise<Product[]> { return this.productsApi.get<Product[]>("/products"); }
  async createCheckout(items: CartItem[]): Promise<{ checkoutUrl: string }> {
    return this.paymentsApi.post("/checkout-sessions", { items: items.map(({ id, quantity }) => ({ productId: id, quantity })) });
  }
}
const storefront = new StorefrontService();

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
let cart: CartItem[] = safelyParseCart(localStorage.getItem("nix-shop-cart") ?? "[]");

function safelyParseCart(value: string): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item: unknown) => {
      if (typeof item !== "object" || item === null) return [];
      const candidate = item as { id?: unknown; quantity?: unknown };
      if (typeof candidate.id !== "string" || !Number.isInteger(candidate.quantity) || Number(candidate.quantity) < 1) return [];
      const product = products.find((entry) => entry.id === candidate.id);
      return product ? [{ ...product, quantity: Math.min(Number(candidate.quantity), 10) }] : [];
    });
  } catch { return []; }
}

function saveCart(): void {
  localStorage.setItem("nix-shop-cart", JSON.stringify(cart.map(({ id, quantity }) => ({ id, quantity }))));
  updateCartCount();
}

function updateCartCount(): void {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach((element) => { element.textContent = String(count); element.hidden = count === 0; });
}

function header(): string {
  return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="#/" aria-label="Nix-Shop home"><span class="brand-mark">N</span>Nix-Shop</a><nav aria-label="Main navigation"><a href="#/shop">Shop</a><a href="#/about">About</a><a class="cart-link" href="#/payment" aria-label="Open cart">Cart <span data-cart-count class="cart-count"></span></a></nav></header>`;
}

function footer(): string {
  return `<footer><a class="brand footer-brand" href="#/">Nix-Shop</a><p>Thoughtful essentials for happy pets.</p><p class="fine-print">© ${new Date().getFullYear()} Nix-Shop · Secure checkout · Easy returns</p></footer>`;
}

function productCard(product: Product): string {
  return `<article class="product-card"><div class="product-art" style="--card-color:${product.color}" aria-hidden="true"><span>${product.icon}</span></div><div class="product-copy"><p class="eyebrow">${product.category}</p><h3>${product.name}</h3><p>${product.description}</p><div class="product-buy"><strong>${money.format(product.price)}</strong><button class="button button-small" data-add="${product.id}">Add to cart</button></div></div></article>`;
}

function homePage(): string {
  return `${header()}<main id="main"><section class="hero"><div><p class="eyebrow">Made for their best days</p><h1>Simple things.<br>Happier pets.</h1><p class="hero-copy">Comfortable, dependable pet essentials chosen to make everyday care feel effortless.</p><div class="hero-actions"><a class="button" href="#/shop">Shop essentials</a><a class="text-link" href="#/about">Why Nix-Shop <span>→</span></a></div></div><div class="hero-art" role="img" aria-label="A happy dog and cat resting together"><div class="sun"></div><span class="pet pet-dog">🐕</span><span class="pet pet-cat">🐈</span><div class="ground"></div></div></section><section class="benefits" aria-label="Store benefits"><div><span>✦</span><strong>Carefully chosen</strong><small>Useful products, no clutter</small></div><div><span>♲</span><strong>Planet-minded</strong><small>Lower-impact materials</small></div><div><span>♡</span><strong>Pet approved</strong><small>Comfort comes first</small></div></section><section class="section"><div class="section-heading"><div><p class="eyebrow">Customer favorites</p><h2>The good stuff</h2></div><a class="text-link" href="#/shop">See everything →</a></div><div class="product-grid">${products.slice(0, 3).map(productCard).join("")}</div></section><section class="story-banner"><div><p class="eyebrow">Our promise</p><h2>Less guesswork.<br>More tail wags.</h2></div><p>We focus on pet essentials that are easy to use, built to last, and comfortable for the animals you love.</p><a class="button button-light" href="#/about">Meet Nix-Shop</a></section></main>${footer()}`;
}

function shopPage(): string {
  return `${header()}<main id="main"><section class="page-intro"><p class="eyebrow">The collection</p><h1>Everyday favorites</h1><p>Useful, comfortable essentials for pets and their people.</p></section><section class="section shop-section"><div class="product-grid">${products.map(productCard).join("")}</div></section></main>${footer()}`;
}

function aboutPage(): string {
  return `${header()}<main id="main"><section class="about-hero"><div><p class="eyebrow">About Nix-Shop</p><h1>Pet care should feel simple.</h1><p>We started Nix-Shop with one idea: finding good products for your pet shouldn't be overwhelming. Our collection stays intentionally small, useful, and easy to understand.</p></div><div class="about-art" role="img" aria-label="A content cat relaxing">🐈</div></section><section class="values section"><p class="eyebrow">What matters to us</p><h2>Chosen with care</h2><div class="value-grid"><article><span>01</span><h3>Comfort first</h3><p>Every item begins with the animal's comfort, safety, and daily routine.</p></article><article><span>02</span><h3>Honest details</h3><p>Clear descriptions and fair prices, so you can choose with confidence.</p></article><article><span>03</span><h3>Less, but better</h3><p>A focused collection of useful products instead of endless options.</p></article></div></section><section class="note"><p>For pets of every shape, size, and personality.</p><a class="button" href="#/shop">Explore the shop</a></section></main>${footer()}`;
}

function paymentPage(): string {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 6;
  const items = cart.length ? cart.map((item) => `<li><div class="mini-art" style="--card-color:${item.color}">${item.icon}</div><div><strong>${item.name}</strong><small>${money.format(item.price)} each</small><div class="quantity"><button data-decrease="${item.id}" aria-label="Remove one ${item.name}">−</button><span>${item.quantity}</span><button data-increase="${item.id}" aria-label="Add one ${item.name}">+</button></div></div><strong>${money.format(item.price * item.quantity)}</strong></li>`).join("") : `<li class="empty-cart"><span>🛒</span><div><strong>Your cart is empty</strong><small>Choose something lovely for your pet.</small></div></li>`;
  return `${header()}<main id="main" class="checkout-page"><section class="checkout-copy"><p class="eyebrow">Secure checkout</p><h1>Your order</h1><a class="text-link" href="#/shop">← Keep shopping</a><ul class="cart-items">${items}</ul></section><aside class="order-card"><h2>Order summary</h2><dl><div><dt>Subtotal</dt><dd>${money.format(subtotal)}</dd></div><div><dt>Shipping</dt><dd>${shipping ? money.format(shipping) : "Free"}</dd></div><div class="order-total"><dt>Total</dt><dd>${money.format(subtotal + shipping)}</dd></div></dl><button id="checkout-button" class="button button-wide" ${cart.length ? "" : "disabled"}>Continue to secure payment</button><p class="secure-note"><span>🔒</span> Card details are handled by a secure payment provider, never stored by Nix-Shop.</p><div id="checkout-message" class="checkout-message" role="status" aria-live="polite"></div></aside></main>${footer()}`;
}

function notFoundPage(): string { return `${header()}<main id="main" class="not-found"><p class="eyebrow">404</p><h1>That page wandered off.</h1><p>Let's get you back to the good stuff.</p><a class="button" href="#/">Go home</a></main>${footer()}`; }

function changeQuantity(id: string, amount: number): void {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;
  item.quantity = Math.max(0, Math.min(10, item.quantity + amount));
  cart = cart.filter((entry) => entry.quantity > 0);
  saveCart(); render();
}

function bindActions(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-add]").forEach((button) => button.addEventListener("click", () => {
    const product = products.find((entry) => entry.id === button.dataset.add);
    if (!product) return;
    const item = cart.find((entry) => entry.id === product.id);
    if (item) item.quantity = Math.min(10, item.quantity + 1); else cart.push({ ...product, quantity: 1 });
    saveCart(); button.textContent = "Added ✓";
    window.setTimeout(() => { button.textContent = "Add to cart"; }, 1200);
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-increase]").forEach((button) => button.addEventListener("click", () => changeQuantity(button.dataset.increase ?? "", 1)));
  document.querySelectorAll<HTMLButtonElement>("[data-decrease]").forEach((button) => button.addEventListener("click", () => changeQuantity(button.dataset.decrease ?? "", -1)));
  document.querySelector<HTMLButtonElement>("#checkout-button")?.addEventListener("click", async () => {
    const message = document.querySelector<HTMLDivElement>("#checkout-message");
    try {
      const session = await storefront.createCheckout(cart);
      if (message) message.textContent = `Secure checkout session created. Development URL: ${session.checkoutUrl}`;
    } catch {
      if (message) message.textContent = "Payment service is unavailable. Start the backend services and try again.";
    }
  });
}

function render(): void {
  const route = window.location.hash.replace(/^#/, "") || "/";
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;
  const pages: Record<string, () => string> = { "/": homePage, "/shop": shopPage, "/about": aboutPage, "/payment": paymentPage };
  app.innerHTML = (pages[route] ?? notFoundPage)();
  document.title = route === "/" ? "Nix-Shop" : `${route.slice(1).replace(/^./, (letter) => letter.toUpperCase())} · Nix-Shop`;
  bindActions(); updateCartCount(); window.scrollTo({ top: 0, behavior: "instant" });
}

window.addEventListener("hashchange", render);
storefront.loadProducts().then((catalog) => {
  products = catalog;
  cart = safelyParseCart(localStorage.getItem("nix-shop-cart") ?? "[]");
  render();
}).catch(() => render());
