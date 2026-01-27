# Multi-stage Dockerfile for Aluminify
# Next.js (port 3000) + Mastra Studio (port 4111)
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
# Mastra AI
ARG AI_MODEL_PROVIDER
ARG GOOGLE_GENERATIVE_AI_API_KEY
ARG OPENAI_API_KEY
ARG LOG_LEVEL
ARG NEXT_PUBLIC_MASTRA_URL

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
ENV AI_MODEL_PROVIDER=$AI_MODEL_PROVIDER
ENV GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_GENERATIVE_AI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV LOG_LEVEL=$LOG_LEVEL
ENV NEXT_PUBLIC_MASTRA_URL=$NEXT_PUBLIC_MASTRA_URL

# Build Next.js application
RUN npm run build

# Build Mastra with Studio UI
RUN npx mastra build --dir mastra --studio

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

# Copy Mastra build output
COPY --from=builder /app/.mastra/output ./.mastra/output

# Copy startup script
COPY --from=builder /app/start.sh ./start.sh
RUN chmod +x ./start.sh

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose ports: Next.js (3000) and Mastra Studio (4111)
EXPOSE 3000 4111

# Health check for Next.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start both services
CMD ["./start.sh"]
