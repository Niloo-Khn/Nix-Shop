# Nix-Shop

A minimal, accessible pet-products storefront built with TypeScript.

## Run locally

```bash
npm install
npm run build
npm run serve
```

## Payment setup

The checkout intentionally does not collect card numbers. Before accepting real orders, connect **Continue to secure payment** to a server-created hosted checkout session from a PCI-compliant provider such as Stripe Checkout. Keep secret keys on the server, validate product IDs and prices server-side, and never trust totals sent by the browser.

## Security choices

- Strict TypeScript and validated saved-cart data
- Restrictive Content Security Policy
- No third-party runtime scripts or trackers
- No raw card inputs or client-side payment secrets
- `.env` files excluded from Git
- Quantity limits and prices resolved from the trusted catalog

## Hosting

This static site can be hosted on GitHub Pages, Cloudflare Pages, Netlify, or Vercel. Real payments also need a small serverless endpoint to create hosted checkout sessions.
