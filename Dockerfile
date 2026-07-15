# Use official lightweight Node.js 20 image
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Run the full-stack production build
# This compiles the Vite frontend into dist/ and bundles the Express server into dist/server.cjs
RUN npm run build

# --- Production Image Stage ---
FROM node:20-slim

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install only production dependencies (excluding devDependencies)
RUN npm ci --only=production

# Copy built assets and server from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Start the full-stack application
CMD ["npm", "start"]
