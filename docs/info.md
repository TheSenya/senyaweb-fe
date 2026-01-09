You currently use adapter-auto. For Docker/Node deployment, we should switch to adapter-node. Concept: SvelteKit builds your app into a standalone Node.js server.

Install adapter: npm install -D @sveltejs/adapter-node

Update svelte.config.js:

import adapter from '@sveltejs/adapter-node'; // Change from adapter-auto
const config = {
    // ...
    kit: {
        adapter: adapter()
    }
};
export default config;

# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# This creates the 'build' folder
RUN npm run build 
RUN npm prune --production
# Run Stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
# Start the built server
CMD [ "node", "build" ]

services:
  # 1. The Frontend
  frontend:
    build: ./fe
    restart: always
    environment:
      # The public URL of your site (for internal Svelte checks)
      - ORIGIN=https://www.yourdomain.com
      # The private internal URL to reach the backend
      # Svelte server-side calls can simple use http://backend:8000
      - PUBLIC_BACKEND_URL=https://api.yourdomain.com
    networks:
      - internal_network
  # 2. The Backend
  backend:
    build: ./backend
    restart: always
    environment:
      # Allow CORS from your frontend domain
      - ALLOWED_ORIGINS=https://www.yourdomain.com
    networks:
      - internal_network
  # 3. Cloudflare Tunnel
  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: always
    command: tunnel run
    environment:
      # The only secret you need. We get this next.
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    networks:
      - internal_network
networks:
  internal_network:
    driver: bridge