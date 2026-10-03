// Upstream reader: the only place that knows what Healthy Selections looks like.
// Per ADR 0002 the catalog is a plain anonymous HTTPS GET; no browser, no
// session. Everything here is a vendor detail; the HTTP contract lives in
// server.mjs.

const DEFAULT_CATALOG_URL = 'https://healthyselections.ca/products.json';
const DEFAULT_PAGE_SIZE = 250;
const DEFAULT_MAX_PAGES = 10;

export class UpstreamError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UpstreamError';
  }
}

// One catalog item per variant: a case size is usually its own variant with
// its own price, and the menu builder prices each pack size separately.
export async function readCatalog({
  fetchImpl = globalThis.fetch,
  catalogUrl = DEFAULT_CATALOG_URL,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
} = {}) {
  const items = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = `${catalogUrl}?limit=${pageSize}&page=${page}`;
    const products = await fetchPage(fetchImpl, url);
    for (const product of products) items.push(...normalizeProduct(product));
    if (products.length < pageSize) return { items };
  }

  console.warn(
    `[hs-prices] catalog still full after ${maxPages} pages; older products are missing`,
  );
  return { items };
}

async function fetchPage(fetchImpl, url) {
  let response;
  try {
    response = await fetchImpl(url);
  } catch (cause) {
    throw new UpstreamError(`request to ${url} failed: ${cause.message}`);
  }
  if (!response.ok) {
    // A gate that closes (ADR 0002's known failure mode) lands here as 401/403.
    throw new UpstreamError(`upstream answered HTTP ${response.status} for ${url}`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new UpstreamError(`upstream body was not JSON (a login page?) for ${url}`);
  }
  if (!Array.isArray(payload?.products)) {
    throw new UpstreamError(`upstream body had no products array for ${url}`);
  }
  return payload.products;
}

function normalizeProduct(product) {
  const bodyText = htmlToText(product?.body_html ?? '');
  const variants =
    Array.isArray(product?.variants) && product.variants.length > 0
      ? product.variants
      : [{}];
  return variants.map((variant) => ({
    title: text(product.title),
    variantTitle: text(variant.title),
    priceCad: price(variant.price),
    sku: variant.sku ? text(variant.sku) : null,
    bodyText,
  }));
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function price(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function htmlToText(html) {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, name) => {
      if (ENTITIES[name.toLowerCase()] !== undefined) return ENTITIES[name.toLowerCase()];
      if (name.startsWith('#x')) return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
      if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
      return match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}
