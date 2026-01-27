# Multi-stage Dockerfile for Aluminify
# Next.js (port 3000)
# Optimized for production with security best practices

# Stage 1: Builder - Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies)
RUN npm install --no-audit --prefer-offline --ignore-scripts

# Copy source code
COPY . .

# Build-time environment variables
# Supabase
ARG SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG SUPABASE_SECRET_KEY
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
# Redis
ARG UPSTASH_REDIS_REST_URL
ARG UPSTASH_REDIS_REST_TOKEN
# Analytics
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
# Superadmin
ARG SUPERADMIN_USERNAME
ARG SUPERADMIN_PASSWORD

# Set environment variables
ENV SUPABASE_URL=$SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
ENV UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL
ENV UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV SUPERADMIN_USERNAME=$SUPERADMIN_USERNAME
ENV SUPERADMIN_PASSWORD=$SUPERADMIN_PASSWORD

# Build Next.js application
RUN npm run build

# Stage 2: Runner - Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package files for runtime
COPY --from=builder /app/package.json ./package.json

# Copy dependencies and assets
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Copy startup script
COPY --from=builder /app/start.sh ./start.sh
RUN chmod +x ./start.sh

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose ports: Next.js (3000)
EXPOSE 3000

# Health check for Next.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["./start.sh"]
