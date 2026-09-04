const copy = {
  "brand.name": "Nix-Shop",
  "nav.skip": "Skip to content", "nav.homeLabel": "Nix-Shop home", "nav.label": "Main navigation", "nav.shop": "Shop", "nav.about": "About", "nav.help": "Help", "nav.account": "Account", "nav.cart": "Cart", "nav.cartLabel": "Open cart",
  "footer.tagline": "Thoughtful essentials for happy pets.", "footer.details": "Secure checkout · Easy returns",
  "product.add": "Add to cart", "product.added": "Added ✓", "product.each": "each", "product.removeOne": "Remove one {name}", "product.addOne": "Add one {name}",
  "home.eyebrow": "Made for their best days", "home.title": "Simple things.<br>Happier pets.", "home.intro": "Comfortable, dependable pet essentials chosen to make everyday care feel effortless.", "home.shop": "Shop essentials", "home.why": "Why Nix-Shop", "home.artLabel": "A happy dog and cat resting together",
  "benefit.label": "Store benefits", "benefit.chosenTitle": "Carefully chosen", "benefit.chosenBody": "Useful products, no clutter", "benefit.planetTitle": "Planet-minded", "benefit.planetBody": "Lower-impact materials", "benefit.petTitle": "Pet approved", "benefit.petBody": "Comfort comes first",
  "favorites.eyebrow": "Customer favorites", "favorites.title": "The good stuff", "favorites.all": "See everything →", "promise.eyebrow": "Our promise", "promise.title": "Less guesswork.<br>More tail wags.", "promise.body": "We focus on pet essentials that are easy to use, built to last, and comfortable for the animals you love.", "promise.action": "Meet Nix-Shop",
  "shop.eyebrow": "The collection", "shop.title": "Everyday favorites", "shop.intro": "Useful, comfortable essentials for pets and their people.",
  "about.eyebrow": "About Nix-Shop", "about.title": "Pet care should feel simple.", "about.intro": "We started Nix-Shop with one idea: finding good products for your pet shouldn't be overwhelming. Our collection stays intentionally small, useful, and easy to understand.", "about.artLabel": "A content cat relaxing", "about.valuesEyebrow": "What matters to us", "about.valuesTitle": "Chosen with care", "about.value1Title": "Comfort first", "about.value1Body": "Every item begins with the animal's comfort, safety, and daily routine.", "about.value2Title": "Honest details", "about.value2Body": "Clear descriptions and fair prices, so you can choose with confidence.", "about.value3Title": "Less, but better", "about.value3Body": "A focused collection of useful products instead of endless options.", "about.note": "For pets of every shape, size, and personality.", "about.action": "Explore the shop",
  "checkout.eyebrow": "Secure checkout", "checkout.title": "Your order", "checkout.continueShopping": "← Keep shopping", "checkout.emptyTitle": "Your cart is empty", "checkout.emptyBody": "Choose something lovely for your pet.", "checkout.summary": "Order summary", "checkout.subtotal": "Subtotal", "checkout.shipping": "Shipping", "checkout.free": "Free", "checkout.total": "Total", "checkout.action": "Continue to secure payment", "checkout.security": "Card details are handled by a secure payment provider, never stored by Nix-Shop.", "checkout.created": "Secure checkout session created. Development URL: {url}", "checkout.unavailable": "Payment service is unavailable. Start the backend services and try again.",
  "account.eyebrow": "Your Nix-Shop", "account.title": "Account", "account.intro": "Sign in to manage your details, or create an account for faster checkout later.", "account.signIn": "Sign in", "account.create": "Create account", "field.name": "Name", "field.email": "Email", "field.password": "Password", "field.subject": "Subject", "field.message": "Message", "account.passwordHint": "Use at least 10 characters.", "account.signedIn": "You are signed in for this browser session.", "account.loginFailed": "Sign-in failed. Check your details and make sure the account service is running.", "account.welcome": "Welcome, {name}. Your account was created.", "account.createFailed": "Account creation failed. Check the form and make sure the account service is running.",
  "help.eyebrow": "Help center", "help.title": "How can we help?", "help.intro": "Browse common questions or send our team a message.", "help.popular": "Popular questions", "help.loading": "Loading help articles…", "help.contact": "Contact us", "help.send": "Send message", "help.unavailable": "Help articles are temporarily unavailable. Please start the help service.", "help.received": "Message received. Ticket {id} was created.", "help.sendFailed": "We couldn't send your message. Make sure the help service is running.",
  "help.article.shipping.title": "Shipping", "help.article.shipping.body": "Standard shipping is free on orders of $60 or more.", "help.article.returns.title": "Returns", "help.article.returns.body": "Contact us within 30 days if an item is not right for your pet.", "help.article.payments.title": "Payments", "help.article.payments.body": "Payments are completed on our secure payment provider's hosted page.",
  "notFound.eyebrow": "404", "notFound.title": "That page wandered off.", "notFound.body": "Let's get you back to the good stuff.", "notFound.action": "Go home"
} as const;

export type CopyKey = keyof typeof copy;
const icons = { brand: "N", dog: "🐕", cat: "🐈", chosen: "✦", planet: "♲", pet: "♡", cart: "🛒", lock: "🔒" } as const;
export type IconKey = keyof typeof icons;
export function icon(key: IconKey): string { return icons[key]; }
export function t(key: CopyKey, values: Record<string, string> = {}): string {
  return Object.entries(values).reduce((value, [name, replacement]) => value.split(`{${name}}`).join(replacement), copy[key] as string);
}

export function helpArticleCopy(id: string): { title: string; body: string } | undefined {
  const title = `help.article.${id}.title` as CopyKey;
  const body = `help.article.${id}.body` as CopyKey;
  return title in copy && body in copy ? { title: t(title), body: t(body) } : undefined;
}
