# Use the official Bun image
FROM oven/bun:latest AS base

# Set working directory
WORKDIR /app

# Copy package.json and bun.lock
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN bun run build

# Production image
FROM oven/bun:latest AS production

WORKDIR /app

# Copy built assets from the base stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/next.config.ts ./next.config.ts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["bun", "start"]
