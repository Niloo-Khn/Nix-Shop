import { productPresentation } from "./catalog-style.js";
import { API_ENDPOINTS } from "./api-config.js";
import { helpArticleCopy, icon, t } from "./content.js";

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
  async helpArticles(): Promise<Array<{ id: string }>> { return this.helpApi.get("/articles"); }
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
  return `<a class="skip-link" href="#main">${t("nav.skip")}</a><header class="site-header"><a class="brand" href="#/" aria-label="${t("nav.homeLabel")}"><span class="brand-mark">${icon("brand")}</span>${t("brand.name")}</a><nav aria-label="${t("nav.label")}"><a href="#/shop">${t("nav.shop")}</a><a href="#/about">${t("nav.about")}</a><a href="#/help">${t("nav.help")}</a><a href="#/account">${t("nav.account")}</a><a class="cart-link" href="#/payment" aria-label="${t("nav.cartLabel")}">${t("nav.cart")} <span data-cart-count class="cart-count"></span></a></nav></header>`;
}

function footer(): string {
  return `<footer><a class="brand footer-brand" href="#/">${t("brand.name")}</a><p>${t("footer.tagline")}</p><p class="fine-print">© ${new Date().getFullYear()} ${t("brand.name")} · ${t("footer.details")}</p></footer>`;
}

function productCard(product: Product): string {
  return `<article class="product-card"><div class="product-art" style="--card-color:${product.color}" aria-hidden="true"><span>${product.icon}</span></div><div class="product-copy"><p class="eyebrow">${product.category}</p><h3>${product.name}</h3><p>${product.description}</p><div class="product-buy"><strong>${money.format(product.price)}</strong><button class="button button-small" data-add="${product.id}">${t("product.add")}</button></div></div></article>`;
}

function homePage(): string {
  return `${header()}<main id="main"><section class="hero"><div><p class="eyebrow">${t("home.eyebrow")}</p><h1>${t("home.title")}</h1><p class="hero-copy">${t("home.intro")}</p><div class="hero-actions"><a class="button" href="#/shop">${t("home.shop")}</a><a class="text-link" href="#/about">${t("home.why")} <span>→</span></a></div></div><div class="hero-art" role="img" aria-label="${t("home.artLabel")}"><div class="sun"></div><span class="pet pet-dog">${icon("dog")}</span><span class="pet pet-cat">${icon("cat")}</span><div class="ground"></div></div></section><section class="benefits" aria-label="${t("benefit.label")}"><div><span>${icon("chosen")}</span><strong>${t("benefit.chosenTitle")}</strong><small>${t("benefit.chosenBody")}</small></div><div><span>${icon("planet")}</span><strong>${t("benefit.planetTitle")}</strong><small>${t("benefit.planetBody")}</small></div><div><span>${icon("pet")}</span><strong>${t("benefit.petTitle")}</strong><small>${t("benefit.petBody")}</small></div></section><section class="section"><div class="section-heading"><div><p class="eyebrow">${t("favorites.eyebrow")}</p><h2>${t("favorites.title")}</h2></div><a class="text-link" href="#/shop">${t("favorites.all")}</a></div><div class="product-grid">${products.slice(0, 3).map(productCard).join("")}</div></section><section class="story-banner"><div><p class="eyebrow">${t("promise.eyebrow")}</p><h2>${t("promise.title")}</h2></div><p>${t("promise.body")}</p><a class="button button-light" href="#/about">${t("promise.action")}</a></section></main>${footer()}`;
}

function shopPage(): string {
  return `${header()}<main id="main"><section class="page-intro"><p class="eyebrow">${t("shop.eyebrow")}</p><h1>${t("shop.title")}</h1><p>${t("shop.intro")}</p></section><section class="section shop-section"><div class="product-grid">${products.map(productCard).join("")}</div></section></main>${footer()}`;
}

function aboutPage(): string {
  return `${header()}<main id="main"><section class="about-hero"><div><p class="eyebrow">${t("about.eyebrow")}</p><h1>${t("about.title")}</h1><p>${t("about.intro")}</p></div><div class="about-art" role="img" aria-label="${t("about.artLabel")}">${icon("cat")}</div></section><section class="values section"><p class="eyebrow">${t("about.valuesEyebrow")}</p><h2>${t("about.valuesTitle")}</h2><div class="value-grid"><article><span>01</span><h3>${t("about.value1Title")}</h3><p>${t("about.value1Body")}</p></article><article><span>02</span><h3>${t("about.value2Title")}</h3><p>${t("about.value2Body")}</p></article><article><span>03</span><h3>${t("about.value3Title")}</h3><p>${t("about.value3Body")}</p></article></div></section><section class="note"><p>${t("about.note")}</p><a class="button" href="#/shop">${t("about.action")}</a></section></main>${footer()}`;
}

function paymentPage(): string {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 6;
  const items = cart.length ? cart.map((item) => `<li><div class="mini-art" style="--card-color:${item.color}">${item.icon}</div><div><strong>${item.name}</strong><small>${money.format(item.price)} ${t("product.each")}</small><div class="quantity"><button data-decrease="${item.id}" aria-label="${t("product.removeOne",{name:item.name})}">−</button><span>${item.quantity}</span><button data-increase="${item.id}" aria-label="${t("product.addOne",{name:item.name})}">+</button></div></div><strong>${money.format(item.price * item.quantity)}</strong></li>`).join("") : `<li class="empty-cart"><span>${icon("cart")}</span><div><strong>${t("checkout.emptyTitle")}</strong><small>${t("checkout.emptyBody")}</small></div></li>`;
  return `${header()}<main id="main" class="checkout-page"><section class="checkout-copy"><p class="eyebrow">${t("checkout.eyebrow")}</p><h1>${t("checkout.title")}</h1><a class="text-link" href="#/shop">${t("checkout.continueShopping")}</a><ul class="cart-items">${items}</ul></section><aside class="order-card"><h2>${t("checkout.summary")}</h2><dl><div><dt>${t("checkout.subtotal")}</dt><dd>${money.format(subtotal)}</dd></div><div><dt>${t("checkout.shipping")}</dt><dd>${shipping ? money.format(shipping) : t("checkout.free")}</dd></div><div class="order-total"><dt>${t("checkout.total")}</dt><dd>${money.format(subtotal + shipping)}</dd></div></dl><button id="checkout-button" class="button button-wide" ${cart.length ? "" : "disabled"}>${t("checkout.action")}</button><p class="secure-note"><span>${icon("lock")}</span> ${t("checkout.security")}</p><div id="checkout-message" class="checkout-message" role="status" aria-live="polite"></div></aside></main>${footer()}`;
}

function accountPage(): string {
  return `${header()}<main id="main" class="portal-page"><section><p class="eyebrow">${t("account.eyebrow")}</p><h1>${t("account.title")}</h1><p class="portal-intro">${t("account.intro")}</p></section><div class="portal-grid"><form id="login-form" class="form-card"><h2>${t("account.signIn")}</h2><label>${t("field.email")}<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label>${t("field.password")}<input name="password" type="password" autocomplete="current-password" minlength="10" required></label><button class="button" type="submit">${t("account.signIn")}</button><p class="form-status" role="status"></p></form><form id="register-form" class="form-card"><h2>${t("account.create")}</h2><label>${t("field.name")}<input name="displayName" autocomplete="name" maxlength="80" required></label><label>${t("field.email")}<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label>${t("field.password")}<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><small>${t("account.passwordHint")}</small><button class="button" type="submit">${t("account.create")}</button><p class="form-status" role="status"></p></form></div></main>${footer()}`;
}

function helpPage(): string {
  return `${header()}<main id="main" class="portal-page"><section><p class="eyebrow">${t("help.eyebrow")}</p><h1>${t("help.title")}</h1><p class="portal-intro">${t("help.intro")}</p></section><div class="help-layout"><section><h2>${t("help.popular")}</h2><div id="help-articles" class="article-list" aria-live="polite"><p>${t("help.loading")}</p></div></section><form id="ticket-form" class="form-card"><h2>${t("help.contact")}</h2><label>${t("field.email")}<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label>${t("field.subject")}<input name="subject" maxlength="120" required></label><label>${t("field.message")}<textarea name="message" maxlength="4000" rows="5" required></textarea></label><button class="button" type="submit">${t("help.send")}</button><p class="form-status" role="status"></p></form></div></main>${footer()}`;
}

function notFoundPage(): string { return `${header()}<main id="main" class="not-found"><p class="eyebrow">${t("notFound.eyebrow")}</p><h1>${t("notFound.title")}</h1><p>${t("notFound.body")}</p><a class="button" href="#/">${t("notFound.action")}</a></main>${footer()}`; }

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
    saveCart(); button.textContent = t("product.added");
    window.setTimeout(() => { button.textContent = t("product.add"); }, 1200);
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-increase]").forEach((button) => button.addEventListener("click", () => changeQuantity(button.dataset.increase ?? "", 1)));
  document.querySelectorAll<HTMLButtonElement>("[data-decrease]").forEach((button) => button.addEventListener("click", () => changeQuantity(button.dataset.decrease ?? "", -1)));
  document.querySelector<HTMLButtonElement>("#checkout-button")?.addEventListener("click", async () => {
    const message = document.querySelector<HTMLDivElement>("#checkout-message");
    try {
      const session = await storefront.createCheckout(cart);
      if (message) message.textContent = t("checkout.created", { url: session.checkoutUrl });
    } catch {
      if (message) message.textContent = t("checkout.unavailable");
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
    try { const result = await storefront.login({ email: formValue(form, "email"), password: formValue(form, "password") }); sessionStorage.setItem("nix-shop-access-token", result.accessToken); setFormStatus(form, t("account.signedIn")); form.reset(); }
    catch { setFormStatus(form, t("account.loginFailed")); }
  });
  document.querySelector<HTMLFormElement>("#register-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
    try { const result = await storefront.register({ email: formValue(form, "email"), displayName: formValue(form, "displayName"), password: formValue(form, "password") }); setFormStatus(form, t("account.welcome",{name:result.displayName})); form.reset(); }
    catch { setFormStatus(form, t("account.createFailed")); }
  });
}

function bindHelpCenter(): void {
  const container = document.querySelector<HTMLElement>("#help-articles");
  if (container) storefront.helpArticles().then((articles) => {
    container.replaceChildren(...articles.flatMap((article) => { const content=helpArticleCopy(article.id); if(!content)return[]; const card=document.createElement("article"); const title=document.createElement("h3"); const body=document.createElement("p"); title.textContent=content.title; body.textContent=content.body; card.append(title,body); return [card]; }));
  }).catch(() => { container.textContent = t("help.unavailable"); });
  document.querySelector<HTMLFormElement>("#ticket-form")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form=event.currentTarget as HTMLFormElement;
    try { const ticket=await storefront.createTicket({ email:formValue(form,"email"),subject:formValue(form,"subject"),message:formValue(form,"message") }); setFormStatus(form,t("help.received",{id:ticket.id.slice(0,8)})); form.reset(); }
    catch { setFormStatus(form,t("help.sendFailed")); }
  });
}

function render(): void {
  const route = window.location.hash.replace(/^#/, "") || "/";
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;
  const pages: Record<string, () => string> = { "/": homePage, "/shop": shopPage, "/about": aboutPage, "/payment": paymentPage, "/account": accountPage, "/help": helpPage };
  app.innerHTML = (pages[route] ?? notFoundPage)();
  document.title = route === "/" ? t("brand.name") : `${route.slice(1).replace(/^./, (letter) => letter.toUpperCase())} · ${t("brand.name")}`;
  bindActions(); updateCartCount(); window.scrollTo({ top: 0, behavior: "instant" });
}

window.addEventListener("hashchange", render);
storefront.loadProducts().then((catalog) => {
  products = catalog;
  cart = safelyParseCart(localStorage.getItem("nix-shop-cart") ?? "[]");
  render();
}).catch(() => render());
