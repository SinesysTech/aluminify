# Multi-stage Dockerfile for Aluminify
# Next.js (port 3000)
# Optimized for production with security best practices

# Stage 1: Builder - Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --no-audit --prefer-offline --ignore-scripts

# Copy source code
COPY . .

# Build-time environment variables
# Supabase
ARG SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG SUPABASE_SECRET_KEY
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
# Auth
ARG OAUTH_ENCRYPTION_KEY
# Analytics
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
# Sentry (Optional)
ARG SENTRY_AUTH_TOKEN
ARG DOCKER_BUILD

# Set environment variables
ENV SUPABASE_URL=$SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
ENV OAUTH_ENCRYPTION_KEY=$OAUTH_ENCRYPTION_KEY
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV DOCKER_BUILD=$DOCKER_BUILD

# Skip env validation at build time (validated at runtime)
ENV SKIP_ENV_VALIDATION=true

# Build Next.js application
RUN npm run build

# Stage 2: Runner - Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Build-time environment variables (repeated for Runner stage to bake them in)
# Supabase
ARG SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG SUPABASE_SECRET_KEY
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
# Auth
ARG OAUTH_ENCRYPTION_KEY
# Analytics
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
# Sentry
ARG SENTRY_AUTH_TOKEN

# Set environment variables in Runner stage
ENV SUPABASE_URL=$SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
ENV OAUTH_ENCRYPTION_KEY=$OAUTH_ENCRYPTION_KEY
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy dependencies and assets
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy startup script and fix Windows CRLF line endings
COPY --from=builder /app/start.sh ./start.sh
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh

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
