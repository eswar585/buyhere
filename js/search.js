const productsContainer =
  document.getElementById("search-products");

const searchInput =
  document.getElementById("search-input");

const clearButton =
  document.getElementById("clear-search");

const resultsCount =
  document.getElementById("results-count");

const resultsTitle =
  document.getElementById("results-title");

const categoryFilters =
  document.getElementById("category-filters");

const resetFilters =
  document.getElementById("reset-filters");


let allProducts = [];
let allCategories = [];

let currentSearch = "";
let currentCategory = "";


/* =========================================
   SUPABASE
========================================= */

async function supabaseRequest(table, query = "") {

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${query}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization:
          `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {

    const error =
      await response.text();

    throw new Error(error);
  }

  return response.json();
}


/* =========================================
   HTML ESCAPE
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
   PRICE
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
   IMAGE
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
      class="product-card"
      href="product.html?slug=${encodeURIComponent(product.slug)}"
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

        <p class="product-description">
          ${escapeHTML(
            product.description || ""
          )}
        </p>


        <div class="product-bottom">

          <strong class="product-price">
            ${formatPrice(product.price)}
          </strong>

          ${
            product.rating
              ? `
                <span class="product-rating">
                  ★ ${product.rating}
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
   RENDER PRODUCTS
========================================= */

function renderProducts() {

  let filtered =
    [...allProducts];


  /* SEARCH */

  if (currentSearch) {

    const search =
      currentSearch.toLowerCase();

    filtered =
      filtered.filter(product => {

        const name =
          product.name?.toLowerCase() || "";

        const description =
          product.description?.toLowerCase() || "";

        const brand =
          product.brands?.name?.toLowerCase() || "";

        return (
          name.includes(search) ||
          description.includes(search) ||
          brand.includes(search)
        );

      });
  }


  /* CATEGORY */

  if (currentCategory) {

    filtered =
      filtered.filter(product =>
        product.category_id ===
        currentCategory
      );
  }


  /* COUNT */

  resultsCount.textContent =
    `${filtered.length} product${
      filtered.length === 1
        ? ""
        : "s"
    }`;


  /* TITLE */

  if (currentSearch) {

    resultsTitle.textContent =
      `Results for "${currentSearch}"`;

  } else {

    resultsTitle.textContent =
      currentCategory
        ? "Category products"
        : "All products";
  }


  /* EMPTY */

  if (!filtered.length) {

    productsContainer.innerHTML = `
      <div class="error-message">

        <strong>
          No products found.
        </strong>

        <br>

        Try another search or remove
        your filters.

      </div>
    `;

    return;
  }


  productsContainer.innerHTML =
    filtered
      .map(createProductCard)
      .join("");
}


/* =========================================
   RENDER CATEGORY FILTERS
========================================= */

function renderCategoryFilters() {

  categoryFilters.innerHTML =
    allCategories
      .map(category => {

        return `
          <label class="filter-option">

            <input
              type="radio"
              name="category"
              value="${category.id}"
            >

            <span>
              ${escapeHTML(category.name)}
            </span>

          </label>
        `;

      })
      .join("");


  categoryFilters
    .querySelectorAll(
      'input[name="category"]'
    )
    .forEach(input => {

      input.addEventListener(
        "change",
        () => {

          currentCategory =
            input.value;

          renderProducts();
        }
      );

    });
}


/* =========================================
   LOAD DATA
========================================= */

async function loadData() {

  try {

    const [
      products,
      categories
    ] = await Promise.all([

      supabaseRequest(
        "products",
        "?select=*,brands(name),product_images(image_url,alt_text,sort_order)&order=created_at.desc"
      ),

      supabaseRequest(
        "categories",
        "?select=id,name,slug,description&order=name.asc"
      )

    ]);


    allProducts =
      products;

    allCategories =
      categories;


    renderCategoryFilters();

    renderProducts();


  } catch (error) {

    console.error(error);

    productsContainer.innerHTML = `
      <div class="error-message">
        Unable to load products.
      </div>
    `;

    resultsCount.textContent =
      "Unable to load";

  }
}


/* =========================================
   SEARCH
========================================= */

searchInput.addEventListener(
  "input",
  () => {

    currentSearch =
      searchInput.value.trim();

    renderProducts();

  }
);


/* =========================================
   CLEAR
========================================= */

clearButton.addEventListener(
  "click",
  () => {

    searchInput.value = "";

    currentSearch = "";

    renderProducts();

    searchInput.focus();

  }
);


/* =========================================
   RESET
========================================= */

resetFilters.addEventListener(
  "click",
  () => {

    currentSearch = "";

    currentCategory = "";

    searchInput.value = "";

    categoryFilters
      .querySelectorAll(
        'input[name="category"]'
      )
      .forEach(input => {
        input.checked = false;
      });

    renderProducts();

  }
);


/* =========================================
   START
========================================= */

loadData();
