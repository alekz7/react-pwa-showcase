import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  initializePerformanceOptimizations,
  performanceReporter,
} from "./utils/performanceOptimizations";

// Initialize error monitoring
import "./utils/errorMonitoring";

// Initialize performance optimizations
initializePerformanceOptimizations();

// Mark app initialization start
performanceReporter.markStart("app-initialization");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Mark app initialization end
performanceReporter.markEnd("app-initialization");

// Report performance metrics in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    performanceReporter.report();
  }, 2000);
}
