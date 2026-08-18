/* =========================================================
   BUYHERE CONFIGURATION & HELPERS (js/config.js)
========================================================= */

// Supabase API Configuration (Replace with your actual keys)
const SUPABASE_URL = "https://your-supabase-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";

/**
 * Safely escapes HTML characters to prevent XSS attacks
 */
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Formats a number or string into INR currency format
 */
function formatPrice(amount) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return "₹0.00";
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(numericAmount);
}
