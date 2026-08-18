const SUPABASE_URL =
  window.SUPABASE_URL;

const SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY;


/* =========================================
   ELEMENTS
========================================= */

const searchResults =
  document.getElementById(
    "search-results"
  );

const noResults =
  document.getElementById(
    "no-results"
  );

const searchTitle =
  document.getElementById(
    "search-title"
  );

const searchDescription =
  document.getElementById(
    "search-description"
  );

const searchInput =
  document.getElementById(
    "search-input"
  );


/* =========================================
   SUPABASE REQUEST
========================================= */

async function getProducts() {

  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?select=id,name,price,slug,product_url,` +
    `product_images(image_url,alt_text,sort_order)` +
    `&order=created_at.desc`;


  const response =
    await fetch(url, {

      headers: {

        apikey:
          SUPABASE_ANON_KEY,

        Authorization:
          `Bearer ${SUPABASE_ANON_KEY}`
      }

    });


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
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================================
   PRICE
========================================= */

function formatPrice(price) {

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

  const images =
    product.product_images || [];


  if (!images.length) {

    return "https://placehold.co/600x600/f5f5f5/777?text=Product";
  }


  const sorted =
    [...images].sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );


  return (
    sorted[0].image_url ||
    "https://placehold.co/600x600/f5f5f5/777?text=Product"
  );
}


/* =========================================
   PRODUCT CARD
========================================= */

function createProductCard(product) {

  const image =
    getProductImage(product);


  const productPage =
    product.slug
      ? `product.html?slug=${encodeURIComponent(
          product.slug
        )}`
      : `product.html?id=${encodeURIComponent(
          product.id
        )}`;


  return `
    <article class="product-card">

      <a
        href="${productPage}"
        class="product-image-link"
      >

        <div class="product-image-wrapper">

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(
              product.name
            )}"
            class="product-image"
            loading="lazy"
          >

        </div>

      </a>


      <div class="product-card-content">

        <h3 class="product-name">

          <a
            href="${productPage}"
          >
            ${escapeHTML(
              product.name
            )}
          </a>

        </h3>


        <div class="product-card-bottom">

          <span class="product-price">
            ${formatPrice(
              product.price
            )}
          </span>


          ${
            product.product_url
              ? `
                <a
                  href="${escapeHTML(
                    product.product_url
                  )}"
                  class="product-checkout"
                  target="_blank"
                  rel="nofollow sponsored noopener"
                >
                  Check out
                </a>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;
}


/* =========================================
   SEARCH
========================================= */

async function searchProducts() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const query =
    (params.get("q") || "")
      .trim();


  /* Put query into search box */

  if (searchInput) {

    searchInput.value =
      query;
  }


  /* Update page heading */

  if (query) {

    searchTitle.textContent =
      `Search results for "${query}"`;

    searchDescription.textContent =
      "Products matching your search.";
  }


  try {

    const products =
      await getProducts();


    let results =
      products;


    /* Filter by name */

    if (query) {

      const searchTerm =
        query.toLowerCase();


      results =
        products.filter(
          product =>
            String(
              product.name || ""
            )
              .toLowerCase()
              .includes(
                searchTerm
              )
        );
    }


    /* No results */

    if (!results.length) {

      searchResults.innerHTML =
        "";

      noResults.hidden =
        false;

      return;
    }


    noResults.hidden =
      true;


    searchResults.innerHTML =
      results
        .map(
          product =>
            createProductCard(
              product
            )
        )
        .join("");


  } catch (error) {

    console.error(
      "Search error:",
      error
    );


    searchResults.innerHTML = `
      <div class="search-error">

        <h3>
          Unable to load products
        </h3>

        <p>
          Please try again later.
        </p>

      </div>
    `;

  }

}


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  searchProducts
);
