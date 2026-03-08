# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json* bun.lockb* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app

# Copy server
COPY server/package.json ./package.json
RUN npm install --production

COPY server/ ./
COPY --from=frontend-builder /app/dist ./public

# Create data directory for menu uploads
RUN mkdir -p /app/data/menus

EXPOSE 3000
CMD ["node", "index.js"]
