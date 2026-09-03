import { productPresentation } from "./catalog-style.js";
import { API_ENDPOINTS } from "./api-config.js";

type Product = { id: string; name: string; category: "Dogs" | "Cats" | "Everyday"; price: number; description: string; icon: string; color: string };
type CartItem = Product & { quantity: number };
type ProductRecord = { id: string; sku: string; price: number; active: boolean };

const fallbackPrices: Record<string, number> = { "cloud-bed": 68, "mouse-toy": 14, "walk-set": 42, "slow-bowl": 24, "groom-brush": 18, "treat-pouch": 22 };
function styledProduct(record: Pick<ProductRecord, "id" | "price">): Product | undefined {
  const presentation = productPresentation[record.id];
  return presentation ? { id: record.id, price: record.price, ...presentation } : undefined;
}
const fallbackProducts = Object.entries(fallbackPrices).flatMap(([id, price]) => { const product = styledProduct({ id, price }); return product ? [product] : []; });
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
  private readonly accountsApi = new ApiClient(API_ENDPOINTS.accounts);
  private readonly productsApi = new ApiClient(API_ENDPOINTS.products);
  private readonly paymentsApi = new ApiClient(API_ENDPOINTS.payments);
  private readonly helpApi = new ApiClient(API_ENDPOINTS.help);
  async loadProducts(): Promise<Product[]> {
    const records = await this.productsApi.get<ProductRecord[]>("/products");
    return records.flatMap((record) => { const product = styledProduct(record); return product ? [product] : []; });
  }
  async createCheckout(items: CartItem[]): Promise<{ checkoutUrl: string }> {
    return this.paymentsApi.post("/checkout-sessions", { items: items.map(({ id, quantity }) => ({ productId: id, quantity })) });
  }
  async register(input: { email: string; displayName: string; password: string }): Promise<{ displayName: string }> { return this.accountsApi.post("/accounts/register", input); }
  async login(input: { email: string; password: string }): Promise<{ accessToken: string }> { return this.accountsApi.post("/accounts/login", input); }
  async helpArticles(): Promise<Array<{ id: string; title: string; body: string }>> { return this.helpApi.get("/articles"); }
  async createTicket(input: { email: string; subject: string; message: string }): Promise<{ id: string }> { return this.helpApi.post("/tickets", input); }
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
  return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="#/" aria-label="Nix-Shop home"><span class="brand-mark">N</span>Nix-Shop</a><nav aria-label="Main navigation"><a href="#/shop">Shop</a><a href="#/about">About</a><a href="#/help">Help</a><a href="#/account">Account</a><a class="cart-link" href="#/payment" aria-label="Open cart">Cart <span data-cart-count class="cart-count"></span></a></nav></header>`;
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

function accountPage(): string {
  return `${header()}<main id="main" class="portal-page"><section><p class="eyebrow">Your Nix-Shop</p><h1>Account</h1><p class="portal-intro">Sign in to manage your details, or create an account for faster checkout later.</p></section><div class="portal-grid"><form id="login-form" class="form-card"><h2>Sign in</h2><label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="10" required></label><button class="button" type="submit">Sign in</button><p class="form-status" role="status"></p></form><form id="register-form" class="form-card"><h2>Create account</h2><label>Name<input name="displayName" autocomplete="name" maxlength="80" required></label><label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><small>Use at least 10 characters.</small><button class="button" type="submit">Create account</button><p class="form-status" role="status"></p></form></div></main>${footer()}`;
}

function helpPage(): string {
  return `${header()}<main id="main" class="portal-page"><section><p class="eyebrow">Help center</p><h1>How can we help?</h1><p class="portal-intro">Browse common questions or send our team a message.</p></section><div class="help-layout"><section><h2>Popular questions</h2><div id="help-articles" class="article-list" aria-live="polite"><p>Loading help articles…</p></div></section><form id="ticket-form" class="form-card"><h2>Contact us</h2><label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label>Subject<input name="subject" maxlength="120" required></label><label>Message<textarea name="message" maxlength="4000" rows="5" required></textarea></label><button class="button" type="submit">Send message</button><p class="form-status" role="status"></p></form></div></main>${footer()}`;
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
  bindAccountForms();
  bindHelpCenter();
}

function formValue(form: HTMLFormElement, name: string): string { return String(new FormData(form).get(name) ?? "").trim(); }
function setFormStatus(form: HTMLFormElement, message: string): void { const status = form.querySelector<HTMLElement>(".form-status"); if (status) status.textContent = message; }

function bindAccountForms(): void {
  document.querySelector<HTMLFormElement>("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
    try { const result = await storefront.login({ email: formValue(form, "email"), password: formValue(form, "password") }); sessionStorage.setItem("nix-shop-access-token", result.accessToken); setFormStatus(form, "You are signed in for this browser session."); form.reset(); }
    catch { setFormStatus(form, "Sign-in failed. Check your details and make sure the account service is running."); }
  });
  document.querySelector<HTMLFormElement>("#register-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
    try { const result = await storefront.register({ email: formValue(form, "email"), displayName: formValue(form, "displayName"), password: formValue(form, "password") }); setFormStatus(form, `Welcome, ${result.displayName}. Your account was created.`); form.reset(); }
    catch { setFormStatus(form, "Account creation failed. Check the form and make sure the account service is running."); }
  });
}

function bindHelpCenter(): void {
  const container = document.querySelector<HTMLElement>("#help-articles");
  if (container) storefront.helpArticles().then((articles) => {
    container.replaceChildren(...articles.map((article) => { const card=document.createElement("article"); const title=document.createElement("h3"); const body=document.createElement("p"); title.textContent=article.title; body.textContent=article.body; card.append(title,body); return card; }));
  }).catch(() => { container.textContent = "Help articles are temporarily unavailable. Please start the help service."; });
  document.querySelector<HTMLFormElement>("#ticket-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form=event.currentTarget as HTMLFormElement;
    try { const ticket=await storefront.createTicket({ email:formValue(form,"email"),subject:formValue(form,"subject"),message:formValue(form,"message") }); setFormStatus(form,`Message received. Ticket ${ticket.id.slice(0,8)} was created.`); form.reset(); }
    catch { setFormStatus(form,"We couldn't send your message. Make sure the help service is running."); }
  });
}

function render(): void {
  const route = window.location.hash.replace(/^#/, "") || "/";
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;
  const pages: Record<string, () => string> = { "/": homePage, "/shop": shopPage, "/about": aboutPage, "/payment": paymentPage, "/account": accountPage, "/help": helpPage };
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
