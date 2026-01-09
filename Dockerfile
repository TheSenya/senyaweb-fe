# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Add build arguments for static env vars
ARG PUBLIC_BACKEND_URL
ARG ORIGIN
ENV PUBLIC_BACKEND_URL=$PUBLIC_BACKEND_URL
ENV ORIGIN=$ORIGIN

# This creates the 'build' folder
RUN npm run build 
RUN npm prune --production
# Run Stage
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
# Start the built server
CMD [ "node", "build" ]