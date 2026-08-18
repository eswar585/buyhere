/* =========================================================
   BUYHERE ADMIN CONTROLLER (js/admin.js)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-product-form");
  if (form) {
    form.addEventListener("submit", handleAddProduct);
  }
  loadAdminProducts();
});

/**
 * Handles adding a new product: uploads image to Storage, inserts into 'products',
 * and links image URL in 'product_images'.
 */
async function handleAddProduct(e) {
  e.preventDefault();

  const nameInput = document.getElementById("product-name");
  const priceInput = document.getElementById("product-price");
  const checkoutInput = document.getElementById("product-checkout");
  const imageInput = document.getElementById("product-image");
  const descInput = document.getElementById("product-description");
  const submitBtn = document.getElementById("submit-btn");

  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const productUrl = checkoutInput.value.trim();
  const description = descInput.value.trim();
  const imageFile = imageInput.files[0];

  if (!name || isNaN(price) || !productUrl || !imageFile) {
    showStatus("Please fill in all required fields.", false);
    return;
  }

  // Generate unique URL slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now();

  try {
    setLoading(true);

    // 1. Upload Image to Supabase Storage Bucket ('product-images')
    const fileName = `${Date.now()}_${imageFile.name.replace(/\s+/g, "_")}`;
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": imageFile.type
      },
      body: imageFile
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload image. Ensure 'product-images' storage bucket exists and is public.");
    }

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;

    // 2. Insert Product into 'products' table
    const productData = {
      name: name,
      price: price,
      slug: slug,
      product_url: productUrl,
      destination_url: productUrl,
      description: description
    };

    const productRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(productData)
    });

    if (!productRes.ok) throw new Error("Failed to insert product record.");
    const newProducts = await productRes.json();
    const createdProduct = newProducts[0];

    // 3. Link image URL in 'product_images' table
    await fetch(`${SUPABASE_URL}/rest/v1/product_images`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_id: createdProduct.id,
        image_url: imageUrl
      })
    });

    showStatus("Product added successfully!", true);
    form.reset();
    loadAdminProducts();

  } catch (error) {
    console.error("Admin Error:", error);
    showStatus(error.message || "Error adding product.", false);
  } finally {
    setLoading(false);
  }
}

/**
 * Loads all existing products into the table
 */
async function loadAdminProducts() {
  const tableBody = document.getElementById("admin-product-list");
  if (!tableBody) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,price&order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!res.ok) throw new Error("Failed to fetch products");
    const products = await res.json();

    if (products.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No products found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = products.map(p => `
      <tr>
        <td><strong>${escapeHTML(p.name)}</strong></td>
        <td>${formatPrice(p.price)}</td>
        <td>
          <button onclick="deleteProduct(${p.id})" class="btn-delete">Delete</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444;">Error loading product table.</td></tr>`;
  }
}

/**
 * Deletes a product by ID
 */
async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!res.ok) throw new Error("Failed to delete product");
    loadAdminProducts();
  } catch (err) {
    alert("Error deleting product: " + err.message);
  }
}

function showStatus(message, isSuccess) {
  const msgEl = document.getElementById("status-msg");
  if (!msgEl) return;
  msgEl.textContent = message;
  msgEl.className = `status-message ${isSuccess ? "status-success" : "status-error"}`;
  msgEl.style.display = "block";
}

function setLoading(isLoading) {
  const submitBtn = document.getElementById("submit-btn");
  if (!submitBtn) return;
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Saving Product..." : "Add Product";
}
