/* =========================================================
   BUYHERE HOMEPAGE
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const HOME_SUPABASE_URL =
  window.SUPABASE_URL;

const HOME_SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY;


/* =========================================================
   ELEMENTS
========================================================= */

const productsGrid =
  document.getElementById(
    "products-grid"
  );

const productsEmpty =
  document.getElementById(
    "products-empty"
  );


/* =========================================================
   SUPABASE
========================================================= */

async function loadHomepageProducts() {

  if (!productsGrid) {

    console.error(
      "Products grid was not found."
    );

    return;
  }


  const url =
    `${HOME_SUPABASE_URL}/rest/v1/products` +
    `?select=id,name,price,slug,product_url,` +
    `product_images(image_url,alt_text,sort_order)` +
    `&order=created_at.desc`;


  try {

    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {

            apikey:
              HOME_SUPABASE_ANON_KEY,

            Authorization:
              `Bearer ${HOME_SUPABASE_ANON_KEY}`
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


    const products =
      await response.json();


    displayProducts(
      products
    );


  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );


    productsGrid.innerHTML = `
      <div class="product-loading">

        Unable to load products.

        <br><br>

        Please try again later.

      </div>
    `;
  }

}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(
  products
) {

  if (!products || !products.length) {

    productsGrid.innerHTML =
      "";


    if (productsEmpty) {

      productsEmpty.hidden =
        false;
    }


    return;
  }


  if (productsEmpty) {

    productsEmpty.hidden =
      true;
  }


  productsGrid.innerHTML =
    products
      .map(
        product =>
          createProductCard(
            product
          )
      )
      .join("");
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(
  product
) {

  const image =
    getProductImage(
      product
    );


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
            src="${escapeHTML(
              image
            )}"
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


/* =========================================================
   GET IMAGE
========================================================= */

function getProductImage(
  product
) {

  const images =
    product.product_images ||
    [];


  if (!images.length) {

    return "https://placehold.co/600x600/f5f5f5/777?text=Product";
  }


  const sortedImages =
    [...images].sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );


  return (
    sortedImages[0].image_url ||
    "https://placehold.co/600x600/f5f5f5/777?text=Product"
  );
}


/* =========================================================
   PRICE
========================================================= */

function formatPrice(
  price
) {

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }
  ).format(price);
}


/* =========================================================
   SECURITY
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
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


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadHomepageProducts();

  }
);
