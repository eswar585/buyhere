const loginSection =
  document.getElementById("login-section");

const dashboardSection =
  document.getElementById("dashboard-section");

const loginForm =
  document.getElementById("login-form");

const logoutButton =
  document.getElementById("logout-button");

const loginMessage =
  document.getElementById("login-message");

const productMessage =
  document.getElementById("product-message");

const productFormWrapper =
  document.getElementById(
    "product-form-wrapper"
  );

const openAddProduct =
  document.getElementById(
    "open-add-product"
  );

const closeProductForm =
  document.getElementById(
    "close-product-form"
  );

const cancelProduct =
  document.getElementById(
    "cancel-product"
  );

const productForm =
  document.getElementById(
    "product-form"
  );

const productImageInput =
  document.getElementById(
    "product-image"
  );

const imagePreview =
  document.getElementById(
    "image-preview"
  );

const productsContainer =
  document.getElementById(
    "admin-products"
  );

const productCount =
  document.getElementById(
    "admin-product-count"
  );


/* =========================================================
   SUPABASE AUTH
========================================================= */

async function supabaseAuth(
  endpoint,
  body
) {

  const response =
    await fetch(
      `${SUPABASE_URL}/auth/v1/${endpoint}`,
      {
        method: "POST",

        headers: {
          apikey:
            SUPABASE_ANON_KEY,

          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      data.error_description ||
      "Authentication failed."
    );
  }


  return data;
}


/* =========================================================
   SUPABASE DATABASE REQUEST
========================================================= */

async function supabaseRequest(
  table,
  query = "",
  options = {}
) {

  const accessToken =
    localStorage.getItem(
      "buyhere_access_token"
    );


  const headers = {

    apikey:
      SUPABASE_ANON_KEY,

    "Content-Type":
      "application/json"
  };


  if (accessToken) {

    headers.Authorization =
      `Bearer ${accessToken}`;
  }


  if (options.prefer) {

    headers.Prefer =
      options.prefer;
  }


  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${table}${query}`,
      {
        method:
          options.method || "GET",

        headers,

        body:
          options.body
            ? JSON.stringify(
                options.body
              )
            : undefined
      }
    );


  const text =
    await response.text();


  if (!response.ok) {

    throw new Error(
      text ||
      `Supabase error ${response.status}`
    );
  }


  return text
    ? JSON.parse(text)
    : null;
}


/* =========================================================
   STORAGE UPLOAD
========================================================= */

async function uploadProductImage(
  file
) {

  const accessToken =
    localStorage.getItem(
      "buyhere_access_token"
    );


  if (!accessToken) {

    throw new Error(
      "You are not logged in."
    );
  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const safeExtension =
    [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ].includes(extension)
      ? extension
      : "webp";


  const fileName =
    `${crypto.randomUUID()}.${safeExtension}`;


  const filePath =
    `products/${fileName}`;


  const response =
    await fetch(
      `${SUPABASE_URL}/storage/v1/object/product-images/${filePath}`,
      {
        method: "POST",

        headers: {

          apikey:
            SUPABASE_ANON_KEY,

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            file.type,

          "x-upsert":
            "false"
        },

        body: file
      }
    );


  if (!response.ok) {

    const error =
      await response.text();

    throw new Error(
      `Image upload failed: ${error}`
    );
  }


  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `product-images/${filePath}`
  );
}


/* =========================================================
   HELPERS
========================================================= */

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


function createSlug(name) {

  return name
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


/* =========================================================
   SHOW LOGIN / DASHBOARD
========================================================= */

function showLogin() {

  loginSection.hidden =
    false;

  dashboardSection.hidden =
    true;

  logoutButton.style.display =
    "none";
}


function showDashboard() {

  loginSection.hidden =
    true;

  dashboardSection.hidden =
    false;

  logoutButton.style.display =
    "inline-flex";
}


/* =========================================================
   CHECK SESSION
========================================================= */

function getStoredUser() {

  const user =
    localStorage.getItem(
      "buyhere_admin_user"
    );

  if (!user) {
    return null;
  }


  try {

    return JSON.parse(user);

  } catch {

    return null;
  }
}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    loginMessage.textContent =
      "Signing in...";


    const email =
      document.getElementById(
        "email"
      ).value.trim();


    const password =
      document.getElementById(
        "password"
      ).value;


    try {

      const data =
        await supabaseAuth(
          "token?grant_type=password",
          {
            email,
            password
          }
        );


      localStorage.setItem(
        "buyhere_access_token",
        data.access_token
      );


      localStorage.setItem(
        "buyhere_refresh_token",
        data.refresh_token
      );


      localStorage.setItem(
        "buyhere_admin_user",
        JSON.stringify(
          data.user
        )
      );


      loginMessage.textContent =
        "";


      showDashboard();

      loadProducts();


    } catch (error) {

      console.error(error);


      loginMessage.textContent =
        error.message ||
        "Unable to sign in.";
    }

  }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutButton.addEventListener(
  "click",
  () => {

    localStorage.removeItem(
      "buyhere_access_token"
    );

    localStorage.removeItem(
      "buyhere_refresh_token"
    );

    localStorage.removeItem(
      "buyhere_admin_user"
    );


    showLogin();
  }
);


/* =========================================================
   OPEN FORM
========================================================= */

openAddProduct.addEventListener(
  "click",
  () => {

    productFormWrapper.hidden =
      false;

    productForm.reset();

    imagePreview.innerHTML =
      "";

    productMessage.textContent =
      "";

    document
      .getElementById(
        "product-name"
      )
      .focus();
  }
);


/* =========================================================
   CLOSE FORM
========================================================= */

function closeForm() {

  productFormWrapper.hidden =
    true;

  productForm.reset();

  imagePreview.innerHTML =
    "";

  productMessage.textContent =
    "";
}


closeProductForm.addEventListener(
  "click",
  closeForm
);


cancelProduct.addEventListener(
  "click",
  closeForm
);


/* =========================================================
   IMAGE PREVIEW
========================================================= */

productImageInput.addEventListener(
  "change",
  () => {

    const file =
      productImageInput.files[0];


    if (!file) {

      imagePreview.innerHTML =
        "";

      return;
    }


    const imageURL =
      URL.createObjectURL(file);


    imagePreview.innerHTML = `
      <img
        src="${imageURL}"
        alt="Product preview"
      >
    `;
  }
);


/* =========================================================
   ADD PRODUCT
========================================================= */

productForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const name =
      document
        .getElementById(
          "product-name"
        )
        .value.trim();


    const price =
      Number(
        document
          .getElementById(
            "product-price"
          )
          .value
      );


    const productURL =
      document
        .getElementById(
          "product-url"
        )
        .value.trim();


    const imageFile =
      productImageInput.files[0];


    if (!name) {

      productMessage.textContent =
        "Enter a product name.";

      return;
    }


    if (
      !Number.isFinite(price) ||
      price < 0
    ) {

      productMessage.textContent =
        "Enter a valid price.";

      return;
    }


    if (!imageFile) {

      productMessage.textContent =
        "Select a product image.";

      return;
    }


    if (!productURL) {

      productMessage.textContent =
        "Enter the checkout URL.";

      return;
    }


    try {

      productMessage.textContent =
        "Uploading image...";


      /* Upload image */

      const imageURL =
        await uploadProductImage(
          imageFile
        );


      productMessage.textContent =
        "Creating product...";


      /* Create slug */

      const baseSlug =
        createSlug(name);


      const slug =
        `${baseSlug}-${Date.now()}`;


      /* Create product */

      const products =
        await supabaseRequest(
          "products",
          "",
          {
            method:
              "POST",

            prefer:
              "return=representation",

            body: {

              name,

              slug,

              price,

              product_url:
                productURL

            }
          }
        );


      const product =
        products[0];


      if (!product) {

        throw new Error(
          "Product was not created."
        );
      }


      /* Create image record */

      await supabaseRequest(
        "product_images",
        "",
        {
          method:
            "POST",

          prefer:
            "return=minimal",

          body: {

            product_id:
              product.id,

            image_url:
              imageURL,

            alt_text:
              name,

            sort_order:
              1
          }
        }
      );


      productMessage.textContent =
        "Product added successfully!";


      productForm.reset();

      imagePreview.innerHTML =
        "";


      await loadProducts();


      setTimeout(
        closeForm,
        1000
      );


    } catch (error) {

      console.error(
        "Add product error:",
        error
      );


      productMessage.textContent =
        error.message ||
        "Unable to add product.";
    }

  }
);


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  productsContainer.innerHTML =
    `<div class="admin-loading">
      Loading products...
    </div>`;


  try {

    const products =
      await supabaseRequest(
        "products",
        "?select=id,name,price,slug,product_url,created_at,product_images(image_url,alt_text,sort_order)&order=created_at.desc"
      );


    productCount.textContent =
      `${products.length} ${
        products.length === 1
          ? "product"
          : "products"
      }`;


    if (!products.length) {

      productsContainer.innerHTML =
        `<div class="admin-empty">
          No products yet.
          Click "Add Product" to create your first one.
        </div>`;

      return;
    }


    productsContainer.innerHTML =
      products
        .map(
          product =>
            createAdminProduct(
              product
            )
        )
        .join("");


  } catch (error) {

    console.error(
      "Load products error:",
      error
    );


    productsContainer.innerHTML =
      `<div class="admin-empty">
        Unable to load products.
      </div>`;
  }
}


/* =========================================================
   ADMIN PRODUCT ROW
========================================================= */

function createAdminProduct(
  product
) {

  const image =
    product.product_images?.[0]
      ?.image_url ||
    "https://placehold.co/100x100/f5f5f5/777?text=Product";


  return `
    <div
      class="admin-product-row"
      data-product-id="${escapeHTML(
        product.id
      )}"
    >

      <img
        class="admin-product-thumb"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(
          product.name
        )}"
      >


      <div class="admin-product-info">

        <strong>
          ${escapeHTML(
            product.name
          )}
        </strong>

        <span>
          ${formatPrice(
            product.price
          )}
        </span>

      </div>


      <div class="admin-product-actions">

        <a
          href="product.html?slug=${encodeURIComponent(
            product.slug
          )}"
          target="_blank"
          class="admin-view-button"
        >
          View
        </a>


        <button
          type="button"
          class="admin-delete-button"
          data-delete-id="${escapeHTML(
            product.id
          )}"
        >
          Delete
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   DELETE PRODUCT
========================================================= */

productsContainer.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "[data-delete-id]"
      );


    if (!button) {
      return;
    }


    const productId =
      button.dataset.deleteId;


    const confirmed =
      window.confirm(
        "Delete this product?"
      );


    if (!confirmed) {
      return;
    }


    button.disabled =
      true;


    button.textContent =
      "Deleting...";


    try {

      await supabaseRequest(
        "products",
        `?id=eq.${encodeURIComponent(
          productId
        )}`,
        {
          method:
            "DELETE"
        }
      );


      await loadProducts();


    } catch (error) {

      console.error(
        "Delete product error:",
        error
      );


      alert(
        "Unable to delete product."
      );


      button.disabled =
        false;

      button.textContent =
        "Delete";
    }

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

const existingUser =
  getStoredUser();


if (existingUser) {

  showDashboard();

  loadProducts();

} else {

  showLogin();
}
