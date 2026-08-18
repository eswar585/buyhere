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
   READ URL PARAMETERS
========================================= */

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const urlCategory =
  urlParams.get("category");

const urlSearch =
  urlParams.get("q");


/* =========================================
   SUPABASE REQUEST
========================================= */

async function supabaseRequest(
  table,
  query = ""
) {

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${query}`,
    {
      method: "GET",

      headers: {
        apikey: SUPABASE_ANON_KEY,

        Authorization:
          `Bearer ${SUPABASE_ANON_KEY}`,

        "Content-Type":
          "application/json"
      }
    }
  );


  if (!response.ok) {

    const error =
      await response.text();

    throw new Error(
      `Supabase error ${response.status}: ${error}`
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
   PRICE
========================================= */

function formatPrice(price) {

  if (
    price === null ||
    price === undefined ||
    price === ""
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
   PRODUCT IMAGE
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
      href="product.html?slug=${encodeURIComponent(
        product.slug
      )}"
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


        ${
          product.description
            ? `
              <p class="product-description">
                ${escapeHTML(
                  product.description
                )}
              </p>
            `
            : ""
        }


        <div class="product-bottom">

          <strong class="product-price">
            ${formatPrice(product.price)}
          </strong>


          ${
            product.rating !== null &&
            product.rating !== undefined
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
   RENDER PRODUCTS
========================================= */

function renderProducts() {

  let filtered =
    [...allProducts];


  /* SEARCH FILTER */

  if (currentSearch) {

    const search =
      currentSearch.toLowerCase();


    filtered =
      filtered.filter(product => {

        const name =
          product.name
            ?.toLowerCase() || "";


        const description =
          product.description
            ?.toLowerCase() || "";


        const brand =
          product.brands?.name
            ?.toLowerCase() || "";


        return (
          name.includes(search) ||
          description.includes(search) ||
          brand.includes(search)
        );
      });
  }


  /* CATEGORY FILTER */

  if (currentCategory) {

    filtered =
      filtered.filter(product =>
        String(product.category_id) ===
        String(currentCategory)
      );
  }


  /* RESULT COUNT */

  resultsCount.textContent =
    `${filtered.length} product${
      filtered.length === 1
        ? ""
        : "s"
    }`;


  /* RESULT TITLE */

  if (currentSearch) {

    resultsTitle.textContent =
      `Results for "${currentSearch}"`;

  } else if (currentCategory) {

    const category =
      allCategories.find(
        item =>
          String(item.id) ===
          String(currentCategory)
      );


    resultsTitle.textContent =
      category
        ? category.name
        : "Category products";

  } else {

    resultsTitle.textContent =
      "All products";
  }


  /* EMPTY STATE */

  if (!filtered.length) {

    productsContainer.innerHTML = `
      <div class="error-message">

        <strong>
          No products found.
        </strong>

        <br>

        Try another search or
        remove your filters.

      </div>
    `;

    return;
  }


  /* RENDER */

  productsContainer.innerHTML =
    filtered
      .map(createProductCard)
      .join("");
}


/* =========================================
   CATEGORY FILTERS
========================================= */

function renderCategoryFilters() {

  categoryFilters.innerHTML =
    allCategories
      .map(category => {

        const checked =
          String(category.id) ===
          String(currentCategory);


        return `
          <label class="filter-option">

            <input
              type="radio"
              name="category"
              value="${escapeHTML(
                category.id
              )}"
              ${checked ? "checked" : ""}
            >

            <span>
              ${escapeHTML(
                category.name
              )}
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


          updateURL();


          renderProducts();
        }
      );
    });
}


/* =========================================
   UPDATE URL
========================================= */

function updateURL() {

  const params =
    new URLSearchParams();


  if (currentSearch) {

    params.set(
      "q",
      currentSearch
    );
  }


  if (currentCategory) {

    params.set(
      "category",
      currentCategory
    );
  }


  const query =
    params.toString();


  const newURL =
    query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;


  window.history.replaceState(
    {},
    "",
    newURL
  );
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


    /* URL SEARCH */

    if (urlSearch) {

      currentSearch =
        urlSearch;


      searchInput.value =
        urlSearch;
    }


    /* URL CATEGORY */

    if (urlCategory) {

      const categoryExists =
        categories.some(
          category =>
            String(category.id) ===
            String(urlCategory)
        );


      if (categoryExists) {

        currentCategory =
          urlCategory;
      }
    }


    renderCategoryFilters();

    renderProducts();


  } catch (error) {

    console.error(
      "Search loading error:",
      error
    );


    productsContainer.innerHTML = `
      <div class="error-message">

        <strong>
          Unable to load products.
        </strong>

        <br>

        Please try again later.

      </div>
    `;


    resultsCount.textContent =
      "Unable to load";
  }
}


/* =========================================
   SEARCH INPUT
========================================= */

searchInput.addEventListener(
  "input",
  () => {

    currentSearch =
      searchInput.value.trim();


    updateURL();


    renderProducts();
  }
);


/* =========================================
   CLEAR SEARCH
========================================= */

clearButton.addEventListener(
  "click",
  () => {

    searchInput.value = "";

    currentSearch = "";

    updateURL();

    renderProducts();

    searchInput.focus();
  }
);


/* =========================================
   RESET FILTERS
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


    updateURL();

    renderProducts();
  }
);


/* =========================================
   START
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadData
);
