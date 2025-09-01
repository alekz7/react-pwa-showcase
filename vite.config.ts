import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "React PWA Showcase",
        short_name: "PWA Showcase",
        description:
          "Comprehensive demonstration of Progressive Web App capabilities and device APIs",
        theme_color: "#2196F3",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/react-pwa-showcase/",
        start_url: "/react-pwa-showcase/",
        icons: [
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: null, // Disable navigate fallback to handle offline routing manually
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
            },
          },
          {
            urlPattern: /\/react-pwa-showcase\/.*\.(js|css|html)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "app-shell-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            urlPattern:
              /\/react-pwa-showcase\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\/react-pwa-showcase\/api\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              networkTimeoutSeconds: 3,
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  base: "/react-pwa-showcase/", // Replace with your repository name
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: "terser", // Use terser for better minification
    target: "es2015", // Support modern browsers for smaller bundle
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ["react", "react-dom", "react-router-dom"],

          // MUI chunk for Material-UI components
          mui: [
            "@mui/material",
            "@mui/icons-material",
            "@mui/system",
            "@emotion/react",
            "@emotion/styled",
          ],

          // Demo chunks for lazy-loaded components
          "demo-media": [
            "./src/pages/CameraDemo",
            "./src/pages/MicrophoneDemo",
          ],
          "demo-sensors": [
            "./src/pages/MotionSensorsDemo",
            "./src/pages/LocationDemo",
          ],
          "demo-files": ["./src/pages/FileSystemDemo"],
          "demo-realtime": [
            "./src/components/demos/RealtimeDemo",
            "./src/components/demos/PWAFeaturesDemo",
          ],
        },

        // Optimize chunk and asset naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                ?.replace(/\.[^/.]+$/, "")
            : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || "")) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || "")) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        entryFileNames: "js/[name]-[hash].js",
      },
    },

    // Optimize build performance
    chunkSizeWarningLimit: 1000, // Warn for chunks larger than 1MB
    reportCompressedSize: false, // Disable gzip size reporting for faster builds

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  assetsInclude: ["**/*.svg"],

  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@mui/material",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
    ],
    exclude: ["@vite/client", "@vite/env"],
  },

  // Performance optimizations
  esbuild: {
    // Remove console logs in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
});
