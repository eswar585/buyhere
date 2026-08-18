const productImage = document.getElementById("product-image");
const productBrand = document.getElementById("product-brand");
const productName = document.getElementById("product-name");
const productRating = document.getElementById("product-rating");
const productPrice = document.getElementById("product-price");
const productDescription = document.getElementById("product-description");
const productLink = document.getElementById("product-link");

const breadcrumbProduct =
  document.getElementById("breadcrumb-product");

const productContainer =
  document.getElementById("product-container");

const productError =
  document.getElementById("product-error");

const relatedProducts =
  document.getElementById("related-products");

const productFeatures =
  document.getElementById("product-features");

const productSpecifications =
  document.getElementById("product-specifications");


/* =========================================
   GET PRODUCT SLUG FROM URL
========================================= */

const urlParams = new URLSearchParams(
  window.location.search
);

const productSlug = urlParams.get("slug");


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
   GET IMAGE
========================================= */

function getProductImage(product) {

  if (
    product.product_images &&
    product.product_images.length > 0
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

  return "https://placehold.co/900x900/f4f5f6/777?text=Product";
}


/* =========================================
   LOAD PRODUCT
========================================= */

async function loadProduct() {

  if (!productSlug) {

    showProductError();

    return;
  }


  try {

    const products =
      await supabaseRequest(
        "products",
        `?select=*,brands(name),product_images(image_url,alt_text,sort_order)&slug=eq.${encodeURIComponent(productSlug)}&limit=1`
      );


    if (!products.length) {

      showProductError();

      return;
    }


    const product =
      products[0];


    renderProduct(product);


    loadRelatedProducts(product);


  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );

    showProductError();

  }
}


/* =========================================
   RENDER PRODUCT
========================================= */

function renderProduct(product) {

  const image =
    getProductImage(product);


  /* PAGE TITLE */

  document.title =
    `${product.name} — BuyHere`;


  /* BREADCRUMB */

  breadcrumbProduct.textContent =
    product.name;


  /* BRAND */

  productBrand.textContent =
    product.brands?.name ||
    "Product";


  /* NAME */

  productName.textContent =
    product.name;


  /* IMAGE */

  productImage.src =
    image;

  productImage.alt =
    product.name;


  /* PRICE */

  productPrice.textContent =
    formatPrice(product.price);


  /* RATING */

  if (
    product.rating !== null &&
    product.rating !== undefined
  ) {

    productRating.innerHTML = `
      <span class="rating-stars">
        ★
      </span>

      <strong>
        ${escapeHTML(product.rating)}
      </strong>

      ${
        product.review_count
          ? `
            <span class="rating-count">
              ${Number(
                product.review_count
              ).toLocaleString("en-IN")}
              reviews
            </span>
          `
          : ""
      }
    `;

  } else {

    productRating.innerHTML = "";
  }


  /* DESCRIPTION */

  productDescription.textContent =
    product.description ||
    "Product details and information.";


  /* PRODUCT LINK */

  if (product.product_url) {

    productLink.href =
      product.product_url;

  } else {

    productLink.href =
      "#";

    productLink.addEventListener(
      "click",
      event => {
        event.preventDefault();
      }
    );
  }


  /* FEATURES */

  renderFeatures(
    product.features
  );


  /* SPECIFICATIONS */

  renderSpecifications(
    product.specifications
  );


  /* SHOW PAGE */

  productContainer.hidden =
    false;

  productError.hidden =
    true;
}


/* =========================================
   FEATURES
========================================= */

function renderFeatures(features) {

  if (!features) {

    document.getElementById(
      "product-features-section"
    ).hidden = true;

    return;
  }


  let featureList = [];


  if (Array.isArray(features)) {

    featureList =
      features;

  } else if (
    typeof features === "string"
  ) {

    featureList =
      features
        .split("\n")
        .map(item => item.trim())
        .filter(Boolean);

  } else if (
    typeof features === "object"
  ) {

    featureList =
      Object.values(features);
  }


  if (!featureList.length) {

    document.getElementById(
      "product-features-section"
    ).hidden = true;

    return;
  }


  productFeatures.innerHTML =
    featureList
      .map(feature => `
        <div class="feature-item">

          <span class="feature-check">
            ✓
          </span>

          <span>
            ${escapeHTML(feature)}
          </span>

        </div>
      `)
      .join("");
}


/* =========================================
   SPECIFICATIONS
========================================= */

function renderSpecifications(
  specifications
) {

  if (!specifications) {

    document.getElementById(
      "product-specs-section"
    ).hidden = true;

    return;
  }


  let specs = [];


  if (
    typeof specifications === "object" &&
    !Array.isArray(specifications)
  ) {

    specs =
      Object.entries(
        specifications
      );

  } else if (
    Array.isArray(specifications)
  ) {

    specs =
      specifications.map(item => {

        if (
          typeof item === "object"
        ) {

          return [
            item.name ||
            item.key ||
            "Specification",

            item.value ||
            ""
          ];

        }

        return [
          "Specification",
          item
        ];
      });
  }


  if (!specs.length) {

    document.getElementById(
      "product-specs-section"
    ).hidden = true;

    return;
  }


  productSpecifications.innerHTML =
    specs
      .map(([key, value]) => `
        <div class="spec-row">

          <span class="spec-name">
            ${escapeHTML(key)}
          </span>

          <span class="spec-value">
            ${escapeHTML(value)}
          </span>

        </div>
      `)
      .join("");
}


/* =========================================
   RELATED PRODUCTS
========================================= */

async function loadRelatedProducts(
  currentProduct
) {

  try {

    let query =
      "?select=*,brands(name),product_images(image_url,alt_text,sort_order)&order=created_at.desc&limit=4";


    if (currentProduct.category_id) {

      query =
        `?select=*,brands(name),product_images(image_url,alt_text,sort_order)&category_id=eq.${encodeURIComponent(currentProduct.category_id)}&id=neq.${encodeURIComponent(currentProduct.id)}&order=created_at.desc&limit=4`;

    } else {

      query =
        `?select=*,brands(name),product_images(image_url,alt_text,sort_order)&id=neq.${encodeURIComponent(currentProduct.id)}&order=created_at.desc&limit=4`;
    }


    const products =
      await supabaseRequest(
        "products",
        query
      );


    if (!products.length) {

      relatedProducts.innerHTML =
        `
          <p class="empty-related">
            More products coming soon.
          </p>
        `;

      return;
    }


    relatedProducts.innerHTML =
      products
        .map(createRelatedCard)
        .join("");


  } catch (error) {

    console.error(
      "Related products error:",
      error
    );

    relatedProducts.innerHTML = "";
  }
}


/* =========================================
   RELATED PRODUCT CARD
========================================= */

function createRelatedCard(product) {

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
   ERROR
========================================= */

function showProductError() {

  productContainer.hidden =
    true;

  productError.hidden =
    false;

  document.title =
    "Product not found — BuyHere";
}


/* =========================================
   START
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadProduct
);
