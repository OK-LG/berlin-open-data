FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist/ ./dist/

# Expose port
EXPOSE 8080

# Run the HTTP server
CMD ["node", "dist/server.js"]
