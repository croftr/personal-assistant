# Dockerfile for AWS Lambda Container Image with Lambda Web Adapter
# This builds a Next.js app with SQLite database baked in for read-only deployment

FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 AS aws-lambda-adapter

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app in standalone mode
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy Lambda Web Adapter from the adapter image
COPY --from=aws-lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter

# Copy built Next.js standalone app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy SQLite database (this makes it read-only but baked into the image)
COPY --from=builder /app/data ./data

# Copy package.json for runtime
COPY --from=builder /app/package.json ./package.json

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose port for Lambda Web Adapter
EXPOSE 3000

# Start Next.js server
CMD ["node", "server.js"]
