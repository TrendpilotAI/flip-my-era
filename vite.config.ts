import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    proxy: {
      '/api/functions': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/functions/, '/functions/v1'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add required Supabase headers
            proxyReq.setHeader('apikey', process.env.VITE_SUPABASE_ANON_KEY || '');
            proxyReq.setHeader('Content-Type', 'application/json');
            
            // Ensure the Authorization header is preserved for native integration
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers for development
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
          });
          
          proxy.on('error', (err, req, res) => {
            // Only log errors in development
            if (mode === 'development') {
              // eslint-disable-next-line no-console
              console.error('Proxy error:', err);
            }
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy error', details: mode === 'development' ? err.message : 'Internal server error' }));
          });
        }
      },
      '/api/rest': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rest/, '/rest/v1'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add required Supabase headers
            proxyReq.setHeader('apikey', process.env.VITE_SUPABASE_ANON_KEY || '');
            proxyReq.setHeader('Content-Type', 'application/json');
            
            // Ensure the Authorization header is preserved for native integration
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers for development
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
          });
          
          proxy.on('error', (err, req, res) => {
            // Only log errors in development
            if (mode === 'development') {
              // eslint-disable-next-line no-console
              console.error('Proxy REST error:', err);
            }
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy REST error', details: mode === 'development' ? err.message : 'Internal server error' }));
          });
        }
      },
      '/api/stream-chapters': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stream-chapters/, '/functions/v1/stream-chapters'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add required Supabase headers
            proxyReq.setHeader('apikey', process.env.VITE_SUPABASE_ANON_KEY || '');
            proxyReq.setHeader('Content-Type', 'application/json');
            
            // Ensure the Authorization header is preserved for native integration
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers for development
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
          });
          
          proxy.on('error', (err, req, res) => {
            // Only log errors in development
            if (mode === 'development') {
              // eslint-disable-next-line no-console
              console.error('Proxy stream-chapters error:', err);
            }
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy stream-chapters error', details: mode === 'development' ? err.message : 'Internal server error' }));
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
    },
  },
  assetsInclude: ['**/*.md'], // Include markdown files as assets
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor libraries
          if (id.includes('node_modules')) {
            // React, React DOM, and React Router must stay together
            // Separating them can cause module resolution issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // Auth library
            if (id.includes('@clerk')) {
              return 'clerk';
            }
            // Database library
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            // Other vendor libraries
            return 'vendor';
          }
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Source maps for production debugging (can be disabled for smaller builds)
    sourcemap: mode === 'development',
    // Minification
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // CSS code splitting
    cssCodeSplit: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
    },
    // Ensure proper module resolution for React
    modulePreload: {
      polyfill: true,
    },
  },
}));
