const categoriesGrid =
  document.getElementById("categories-grid");

const categoryProducts =
  document.getElementById("category-products");


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
        Authorization:
          `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `Supabase error ${response.status}: ${errorText}`
    );
  }

  return response.json();
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
   FORMAT PRICE
========================================= */

function formatPrice(price) {

  if (
    price === null ||
    price === undefined
  ) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }
  ).format(price);
}


/* =========================================
   GET IMAGE
========================================= */

function getProductImage(product) {

  if (
    product.product_images &&
    product.product_images.length
  ) {

    const images =
      [...product.product_images];

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
   CATEGORY CARD
========================================= */

function createCategoryCard(
  category,
  index,
  productCount
) {

  const number =
    String(index + 1).padStart(2, "0");


  return `
    <a
      href="search.html?category=${encodeURIComponent(category.id)}"
      class="category-large-card"
    >

      <div class="category-card-number">
        ${number}
      </div>


      <div class="category-card-content">

        <h3>
          ${escapeHTML(category.name)}
        </h3>


        ${
          category.description
            ? `
              <p>
                ${escapeHTML(
                  category.description
                )}
              </p>
            `
            : `
              <p>
                Discover products in this category.
              </p>
            `
        }


        <span class="category-product-count">
          ${productCount}
          ${
            productCount === 1
              ? " product"
              : " products"
          }
        </span>

      </div>


      <span class="category-arrow">
        →
      </span>

    </a>
  `;
}


/* =========================================
   PRODUCT CARD
========================================= */

function createProductCard(product) {

  const image =
    getProductImage(product);

  const brand =
    product.brands?.name ||
    "Product";


  return `
    <a
      href="product.html?slug=${encodeURIComponent(product.slug)}"
      class="product-card"
    >

      <div class="product-image">

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


        <div class="product-bottom">

          <strong class="product-price">
            ${formatPrice(product.price)}
          </strong>


          ${
            product.rating
              ? `
                <span class="product-rating">
                  ★ ${escapeHTML(
                    product.rating
                  )}
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

      categoriesGrid.innerHTML = `
        <div class="error-message">
          No categories available yet.
        </div>
      `;

      return;
    }


    /*
      Load products separately so we can
      show the number of products inside
      every category.
    */

    const products =
      await supabaseRequest(
        "products",
        "?select=id,category_id"
      );


    categoriesGrid.innerHTML =
      categories
        .map(category => {

          const count =
            products.filter(
              product =>
                String(product.category_id) ===
                String(category.id)
            ).length;

          return createCategoryCard(
            category,
            categories.indexOf(category),
            count
          );

        })
        .join("");


  } catch (error) {

    console.error(
      "Category loading error:",
      error
    );


    categoriesGrid.innerHTML = `
      <div class="error-message">

        <strong>
          Unable to load categories.
        </strong>

        <br>

        Please try again later.

      </div>
    `;
  }
}


/* =========================================
   LOAD POPULAR PRODUCTS
========================================= */

async function loadPopularProducts() {

  try {

    const products =
      await supabaseRequest(
        "products",
        "?select=*,brands(name),product_images(image_url,alt_text,sort_order)&order=created_at.desc&limit=4"
      );


    if (!products.length) {

      categoryProducts.innerHTML = `
        <div class="error-message">
          No products available yet.
        </div>
      `;

      return;
    }


    categoryProducts.innerHTML =
      products
        .map(createProductCard)
        .join("");


  } catch (error) {

    console.error(
      "Popular products error:",
      error
    );


    categoryProducts.innerHTML = `
      <div class="error-message">
        Unable to load products.
      </div>
    `;
  }
}


/* =========================================
   INITIALIZE
========================================= */

async function initializeCategories() {

  if (
    !categoriesGrid ||
    !categoryProducts
  ) {
    console.error(
      "Category page containers not found."
    );

    return;
  }


  await Promise.all([
    loadCategories(),
    loadPopularProducts()
  ]);
}


/* =========================================
   START
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeCategories
);
