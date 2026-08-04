# ---------- Stage 1: Build ----------
FROM node:22.17.0-alpine AS builder

WORKDIR /app

# Build arguments
ARG BUILD_CONFIGURATION=production

# Make it available as env inside the image
ENV BUILD_CONFIGURATION=${BUILD_CONFIGURATION}

# Copy package files first (better caching)
COPY package*.json ./

# Configure Azure Artifacts authentication
RUN npm ci

# Copy rest of the source
COPY . .

# Build Angular
RUN npm run build -- --configuration=${BUILD_CONFIGURATION}


# ---------- Stage 2: Runtime ----------
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*
RUN rm /etc/nginx/conf.d/default.conf


COPY --from=builder /app/dist/kontratgest-frontend/browser /usr/share/nginx/html

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

COPY deploy/run.sh /run.sh
RUN chmod +x /run.sh

ENTRYPOINT ["/run.sh"]