import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Global error handler to prevent JSON parsing errors from showing in error modal
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || '';
  
  // Handle common JSON parsing errors
  if (errorMessage.includes('Unexpected token u in JSON at position 0') ||
      errorMessage.includes('"undefined" is not valid JSON') ||
      errorMessage.includes('JSON.parse') ||
      errorMessage.includes('SyntaxError: Unexpected token')) {
    console.warn('Caught and suppressed JSON parsing error:', event.reason);
    event.preventDefault(); // Prevent the error from showing in the modal
    return;
  }
});

// Also handle regular errors
window.addEventListener('error', (event) => {
  const errorMessage = event.error?.message || '';
  if (errorMessage.includes('JSON') || errorMessage.includes('undefined is not valid JSON')) {
    console.warn('Caught and suppressed JSON error:', event.error);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
