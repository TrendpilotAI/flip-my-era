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
  optimizeDeps: {
    // Ensure React is pre-bundled and available early
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    // Force React to be included in the optimized dependencies
    force: false,
    // Ensure React loads before other dependencies
    esbuildOptions: {
      // This ensures React is processed first
    },
  },
  assetsInclude: ['**/*.md'], // Include markdown files as assets
  build: {
    chunkSizeWarningLimit: 500,
    sourcemap: mode === 'development',
    minify: 'esbuild',
    target: 'esnext',
    cssCodeSplit: true,
    commonjsOptions: {
      include: [/node_modules/],
    },
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-clerk': ['@clerk/clerk-react'],
          'vendor-sentry': ['@sentry/react'],
          'vendor-framer': ['framer-motion'],
          'vendor-radix': ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-toast', '@radix-ui/react-tabs', '@radix-ui/react-select', '@radix-ui/react-dropdown-menu', '@radix-ui/react-accordion'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
}));
