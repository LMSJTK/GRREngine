# ==========================================
# Stage 1: Build the application
# ==========================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies (using ci for deterministic installs)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Vite application (outputs to /app/dist)
RUN npm run build

# ==========================================
# Stage 2: Serve with Nginx
# ==========================================
FROM nginx:alpine AS production

# Copy the build output from the builder stage to Nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom Nginx config (optional but recommended for SPAs)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]