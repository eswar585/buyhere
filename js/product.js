/* =========================================================
   BUYHERE PRODUCT DETAIL ENGINE (js/product.js)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadProductDetails();
});

async function loadProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const slug = urlParams.get("slug");

  if (!id && !slug) {
    showError("No product identifier provided.");
    return;
  }

  try {
    // Build query based on ID or Slug
    let queryParam = id ? `id=eq.${id}` : `slug=eq.${slug}`;
    const productRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?${queryParam}&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!productRes.ok) throw new Error("Failed to load product details");
    const products = await productRes.json();

    if (!products || products.length === 0) {
      showError("Product not found.");
      return;
    }

    const product = products[0];

    // Populate Page Elements
    document.title = `${product.name} — BuyHere`;
    
    const nameEl = document.getElementById("product-name");
    const priceEl = document.getElementById("product-price");
    const descEl = document.getElementById("product-description");
    const linkEl = document.getElementById("product-link");

    if (nameEl) nameEl.textContent = product.name;
    if (priceEl) priceEl.textContent = formatPrice(product.price);
    if (descEl) descEl.textContent = product.description || "No description available for this product.";
    if (linkEl) {
      linkEl.href = product.product_url || product.destination_url || "#";
    }

    // Fetch Product Image
    const imageRes = await fetch(
      `${SUPABASE_URL}/rest/v1/product_images?product_id=eq.${product.id}&select=image_url&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const images = imageRes.ok ? await imageRes.json() : [];
    const imageEl = document.getElementById("product-image");
    
    if (imageEl) {
      imageEl.src = (images.length > 0 && images[0].image_url) 
        ? images[0].image_url 
        : "https://placehold.co/500x500/f5f5f5/777?text=No+Image+Available";
      imageEl.alt = product.name;
    }

  } catch (error) {
    console.error("Error loading product detail:", error);
    showError("An error occurred while loading this product.");
  }
}

function showError(message) {
  const container = document.getElementById("product-container");
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <h2 style="color: #ef4444; margin-bottom: 12px;">Oops!</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">${escapeHTML(message)}</p>
        <a href="index.html" class="checkout-button" style="display: inline-block; width: auto; padding: 10px 24px;">Return to Home</a>
      </div>
    `;
  }
}
