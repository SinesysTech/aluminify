# Multi-stage Dockerfile for Aluminify Next.js Application
# Optimized for production with security best practices

# Stage 1: Dependencies - Install production dependencies only
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Stage 2: Builder - Build the application
FROM node:20-alpine AS builder

ARG DOCKER_BUILD=false

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Set environment variable for build
ENV DOCKER_BUILD=$DOCKER_BUILD

# Build Next.js application
RUN npm run build

# Stage 3: Runner - Production runtime
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
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy built application
# Conditional copy based on build type (checked at runtime or build time, but here we copy what's available or use logic)
# We need to copy based on how it was built. Since COPY doesn't support conditional logic based on ARGs from previous stages directly in a simple way without complex hacks,
# we will use a shell script or copy both if possible, but cleaner is to rely on what exists or copy conditionally using a shell in an intermediate step if needed.
# However, the user requested:
# RUN if [ "$DOCKER_BUILD" = "true" ]; then ... else ... fi
# We need to make sure DOCKER_BUILD is available here or just detect the directory structure?
# The user instruction was explicit:
# RUN if [ "$DOCKER_BUILD" = "true" ]; then \n cp -r /app/.next/standalone . && cp -r /app/.next/static ./.next/static; \n else \n cp -r /app/.next ./.next; \n fi

# We need to bring DOCKER_BUILD arg to this stage if we want to use it, or just persist it.
# Let's declare ARG again.
ARG DOCKER_BUILD=false

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# We need to copy .next from builder to a temporary location to selectively copy?
# Or we can copy the whole .next folder and then rearrange?
# The user's instruction implies we are running a shell command to copy *from* /app (which implies we need access to the builder's fs or we copy everything first).
# Actually, `COPY --from=builder` is a docker instruction. We can't put `if` inside `COPY`.
# The user's instruction:
# RUN if [ "$DOCKER_BUILD" = "true" ]; then ...
# This implies we are running a shell command inside the `runner` stage.
# BUT we need the files from `builder` to be available to `cp`.
# The standard pattern is to COPY everything we might need, OR use a conditional COPY which Docker doesn't support easily.
# BUT, we can COPY the `.next` directory to a temp location and then move it?
# Or, clearer: We can't conditionally COPY.
# However, if we look closely at the user request:
# "Runner stage: COPY --from=builder /app/node_modules ./node_modules ... RUN if [ "$DOCKER_BUILD" = "true" ]; then ..."
# This implies the user *thinks* we can access /app from builder inside the RUN command? That's not how multi-stage works usually, unless we mount it?
# Wait, `cp -r /app/.next/standalone .` implies `/app` is the WORKDIR or source?
# Ah, if we are inside `runner`, `/app` is the current workdir.
# But we verify where the files come from.
# `COPY --from=builder /app/.next ./.next` -- this copies it.
# If we built standalone, `.next` contains `standalone` folder? Yes.
# If we built standard, `.next` contains everything? Yes.
# The user's snippet:
#   COPY --from=builder /app/node_modules ./node_modules
#   COPY --from=builder /app/public ./public
#   RUN if [ "$DOCKER_BUILD" = "true" ]; then ...
# This logic implies we haven't copied `.next` yet?
# Or maybe the user expects us to COPY from builder in a way that allows us to move it?
# Actually, the user's snippet DOES NOT include `COPY --from=builder /app/.next` BEFORE the RUN.
# This suggests the user might have made a mistake in the snippet or expects me to figure out how to access builder files.
# Standard way: COPY --from=builder /app/.next /app/.next_temp
# Then move.
# OR, maybe the user implies we are copying from builder *inside* the RUN? No, RUN runs in the container.
# I will implement a safe approach:
# 1. COPY --from=builder /app/.next /app/.next_source
# 2. RUN logic to move files.
# 3. Cleanup.

# Let's adjust to be robust.
COPY --from=builder --chown=nextjs:nodejs /app/.next /app/.next_source

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
# We need to set the CMD conditionally too.
# CMD ["node", "$DOCKER_BUILD" = "true" ? "server.js" : "node_modules/.bin/next", "start"]
# Shell form is needed for variable expansion/logic? Or use the entrypoint script?
# User suggestion: CMD ["node", "$DOCKER_BUILD" = "true" ? "server.js" : "node_modules/.bin/next", "start"]
# This syntax `? :` is not valid in CMD array [].
# It must be handled via sh -c or similar.
# "CMD sh -c 'if ...'"

# Let's look at the RUN block again.
# The user specified:
# RUN if [ "$DOCKER_BUILD" = "true" ]; then \n    cp -r /app/.next/standalone . && cp -r /app/.next/static ./.next/static; \n  else \n    cp -r /app/.next ./.next; \n  fi
# This requires /app/.next (from builder) to be available at /app/.next (or similar) BEFORE this runs?
# But `COPY --from=builder` is how we get files.
# So I will COPY to a temporary location first.

COPY --from=builder --chown=nextjs:nodejs /app/.next /app/.temp_next

RUN if [ "$DOCKER_BUILD" = "true" ]; then \
      cp -r /app/.temp_next/standalone/. . && \
      mkdir -p .next/static && \
      cp -r /app/.temp_next/static/. .next/static; \
    else \
      cp -r /app/.temp_next/. .next; \
    fi && \
    rm -rf /app/.temp_next

# Correct CMD
CMD if [ "$DOCKER_BUILD" = "true" ]; then \
      node server.js; \
    else \
      npm start; \
    fi
