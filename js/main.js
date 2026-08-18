/* =========================================================
   BUYHERE MAIN CATALOG LOGIC (js/main.js)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadFeaturedProducts();
});

async function loadFeaturedProducts() {
  const gridContainer = document.getElementById("product-grid");
  if (!gridContainer) return;

  gridContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Loading products...</div>`;

  try {
    // Fetch products sorted by newest first
    const productsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,price,slug,product_url,destination_url&order=created_at.desc&limit=12`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!productsRes.ok) throw new Error("Failed to load products");
    const products = await productsRes.json();

    if (!products || products.length === 0) {
      gridContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No products found in the catalog.</div>`;
      return;
    }

    // Fetch primary product images
    const imagesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/product_images?select=product_id,image_url`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const images = imagesRes.ok ? await imagesRes.json() : [];
    const imageMap = {};
    images.forEach(img => {
      if (!imageMap[img.product_id]) {
        imageMap[img.product_id] = img.image_url;
      }
    });

    // Render Product Cards
    gridContainer.innerHTML = products.map(product => {
      const imageUrl = imageMap[product.id] || "https://placehold.co/300x300/f5f5f5/777?text=No+Image";
      const checkoutUrl = product.product_url || product.destination_url || "#";
      const productDetailUrl = product.slug ? `product.html?slug=${product.slug}` : `product.html?id=${product.id}`;

      return `
        <div class="product-card">
          <div class="product-card-image">
            <a href="${escapeHTML(productDetailUrl)}">
              <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(product.name)}" loading="lazy">
            </a>
          </div>
          
          <div class="product-card-body">
            <h3 class="product-card-title">
              <a href="${escapeHTML(productDetailUrl)}" style="color: inherit; text-decoration: none;">
                ${escapeHTML(product.name)}
              </a>
            </h3>
            <p class="product-card-price">${formatPrice(product.price)}</p>
          </div>

          <div class="product-card-action">
            <a href="${escapeHTML(checkoutUrl)}" target="_blank" rel="nofollow sponsored noopener" class="checkout-button">
              View Deal
            </a>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Error loading home page catalog:", error);
    gridContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #ef4444; padding: 40px;">Unable to load catalog right now. Please refresh.</div>`;
  }
}
