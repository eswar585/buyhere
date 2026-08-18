const featuredContainer = document.getElementById("featured-products");
const trendingContainer = document.getElementById("trending-products");
const categoriesContainer = document.getElementById("categories");


/* =========================================
   SUPABASE REQUEST
========================================= */

async function supabaseRequest(table, query = "") {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${query}`,
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Supabase error ${response.status}: ${errorText}`
    );
  }

  return response.json();
}


/* =========================================
   FORMAT PRICE
========================================= */

function formatPrice(price) {
  if (price === null || price === undefined) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================
   PRODUCT IMAGE
========================================= */

function getProductImage(product) {
  if (
    product.product_images &&
    product.product_images.length > 0
  ) {
    const images = [...product.product_images];

    images.sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );

    return images[0].image_url;
  }

  return "https://placehold.co/800x800/f4f5f6/777?text=Product";
}


/* =========================================
   PRODUCT CARD
========================================= */

function createProductCard(product) {
  const image = getProductImage(product);

  const brand =
    product.brands?.name || "Product";

  const rating =
    product.rating !== null &&
    product.rating !== undefined
      ? `★ ${product.rating}`
      : "";

  const reviews =
    product.review_count
      ? `(${Number(product.review_count).toLocaleString("en-IN")})`
      : "";

  return `
    <a
      href="product.html?slug=${encodeURIComponent(product.slug)}"
      class="product-card"
    >

      <div class="product-image">

        ${
          product.featured
            ? `<span class="product-badge">FEATURED</span>`
            : ""
        }

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
        >

      </div>


      <div class="product-content">

        <div class="product-brand">
          ${escapeHTML(brand)}
        </div>

        <h3 class="product-name">
          ${escapeHTML(product.name)}
        </h3>

        <p class="product-description">
          ${escapeHTML(product.description || "")}
        </p>


        <div class="product-bottom">

          <strong class="product-price">
            ${formatPrice(product.price)}
          </strong>

          ${
            rating
              ? `
                <span class="product-rating">
                  ${rating}
                  ${
                    reviews
                      ? `<span>${reviews}</span>`
                      : ""
                  }
                </span>
              `
              : ""
          }

        </div>

      </div>

    </a>
  `;
}


/* =========================================
   CATEGORY CARD
========================================= */

function createCategoryCard(category, index) {
  const number =
    String(index + 1).padStart(2, "0");

  return `
    <a
      href="category.html?slug=${encodeURIComponent(category.slug)}"
      class="category-card"
    >

      <span class="category-number">
        ${number}
      </span>

      <strong class="category-name">
        ${escapeHTML(category.name)}
      </strong>

      ${
        category.description
          ? `
            <span class="category-description">
              ${escapeHTML(category.description)}
            </span>
          `
          : ""
      }

    </a>
  `;
}


/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadProducts() {
  try {

    const products = await supabaseRequest(
      "products",
      "?select=*,brands(name),product_images(image_url,alt_text,sort_order)&order=created_at.desc"
    );


    /* -----------------------------
       Featured products
    ----------------------------- */

    const featuredProducts =
      products.filter(
        product => product.featured === true
      );


    /* -----------------------------
       Trending products
       For now we use the latest
       products until we build
       proper collection queries.
    ----------------------------- */

    const trendingProducts =
      products.slice(0, 3);


    /* -----------------------------
       Render Featured
    ----------------------------- */

    if (featuredProducts.length > 0) {

      featuredContainer.innerHTML =
        featuredProducts
          .slice(0, 6)
          .map(createProductCard)
          .join("");

    } else {

      featuredContainer.innerHTML = `
        <div class="error-message">
          No featured products available yet.
        </div>
      `;

    }


    /* -----------------------------
       Render Trending
    ----------------------------- */

    if (trendingProducts.length > 0) {

      trendingContainer.innerHTML =
        trendingProducts
          .map(createProductCard)
          .join("");

    } else {

      trendingContainer.innerHTML = `
        <div class="error-message">
          No products available yet.
        </div>
      `;

    }

  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );

    featuredContainer.innerHTML = `
      <div class="error-message">
        <strong>Unable to load products.</strong>
        <br>
        Please try again later.
      </div>
    `;

    trendingContainer.innerHTML = `
      <div class="error-message">
        <strong>Unable to load products.</strong>
        <br>
        Please try again later.
      </div>
    `;
  }
}


/* =========================================
   LOAD CATEGORIES
========================================= */

async function loadCategories() {
  try {

    const categories =
      await supabaseRequest(
        "categories",
        "?select=id,name,slug,description&order=name.asc"
      );


    if (!categories.length) {

      categoriesContainer.innerHTML = `
        <div class="error-message">
          No categories available yet.
        </div>
      `;

      return;
    }


    categoriesContainer.innerHTML =
      categories
        .slice(0, 8)
        .map(createCategoryCard)
        .join("");

  } catch (error) {

    console.error(
      "Category loading error:",
      error
    );

    categoriesContainer.innerHTML = `
      <div class="error-message">
        <strong>Unable to load categories.</strong>
        <br>
        Please try again later.
      </div>
    `;
  }
}


/* =========================================
   INITIALIZE HOME PAGE
========================================= */

async function initializeHomePage() {

  if (
    !featuredContainer ||
    !trendingContainer ||
    !categoriesContainer
  ) {
    console.error(
      "Required homepage containers were not found."
    );

    return;
  }


  await Promise.all([
    loadProducts(),
    loadCategories()
  ]);
}


/* =========================================
   START
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeHomePage
);
