import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs';

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
            // Log the request for debugging
            console.log(`Proxying request to: ${proxyReq.path}`);
            
            // Add required Supabase headers
            proxyReq.setHeader('apikey', process.env.VITE_SUPABASE_ANON_KEY || '');
            proxyReq.setHeader('Content-Type', 'application/json');
            
            // Ensure the Authorization header is preserved for native integration
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Log the response for debugging
            console.log(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
            
            // Add CORS headers for development
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
          });
        }
      },
      '/api/rest': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rest/, '/rest/v1'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log the request for debugging
            console.log(`Proxying REST request to: ${proxyReq.path}`);
            
            // Add required Supabase headers
            proxyReq.setHeader('apikey', process.env.VITE_SUPABASE_ANON_KEY || '');
            proxyReq.setHeader('Content-Type', 'application/json');
            
            // Ensure the Authorization header is preserved for native integration
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Log the response for debugging
            console.log(`Proxy REST response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
            
            // Add CORS headers for development
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('Proxy REST error:', err);
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy REST error', details: err.message }));
          });
        }
      },
      '/api/stream-chapters': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stream-chapters/, '/functions/v1/stream-chapters'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log the request for debugging
            console.log(`Proxying stream-chapters request to: ${proxyReq.path}`);
            
            // Add required Supabase headers
            proxyReq.setHeader('apikey', process.env.VITE_SUPABASE_ANON_KEY || '');
            proxyReq.setHeader('Content-Type', 'application/json');
            
            // Ensure the Authorization header is preserved for native integration
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Log the response for debugging
            console.log(`Proxy stream-chapters response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
            
            // Add CORS headers for development
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('Proxy stream-chapters error:', err);
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy stream-chapters error', details: err.message }));
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
}));
