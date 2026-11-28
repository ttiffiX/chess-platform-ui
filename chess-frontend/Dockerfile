# syntax=docker/dockerfile:1

# =========================
# Stage 1: Build React app
# =========================
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Install dependencies first to take advantage of Docker layer caching.
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and create the production build.
COPY . .
RUN npm run build


# =========================
# Stage 2: Serve with Nginx
# =========================
FROM nginx:stable-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Ask Nginx to gracefully stop its workers when the container stops.
STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
