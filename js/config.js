/* =========================================================
   BUYHERE CONFIGURATION & HELPERS (js/config.js)
========================================================= */

// Supabase API Configuration
const SUPABASE_URL = "https://grmgrvlcgdjgeqnwwvos.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybWdydmxjZ2RqZ2Vxbnd3dm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjY2MjcsImV4cCI6MjEwMjU0MjYyN30.ertuXZCkQX4sfOSvxF6UY7zC56MP_qCx4_hLDPdJ5Xw";

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
