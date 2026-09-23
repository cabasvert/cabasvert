# ==============================================================================
# Stage 1: Build frontend and backend from source
# ==============================================================================
FROM node:14-alpine AS builder

WORKDIR /app

# Copy root dependency manifests & scripts
COPY package.json yarn.lock lerna.json tslint.json ./
COPY scripts ./scripts

# Copy package manifests and client scripts (needed for postinstall hook)
COPY packages/data/package.json ./packages/data/
COPY packages/client/package.json ./packages/client/
COPY packages/client/scripts ./packages/client/scripts
COPY packages/server/package.json ./packages/server/
COPY packages/tools/package.json ./packages/tools/
COPY packages/e2e/package.json ./packages/e2e/

# Install dependencies for monorepo workspaces
RUN yarn install --pure-lockfile --ignore-optional

# Copy all source packages
COPY packages ./packages

# Build @cabasvert/data
RUN cd packages/data && yarn compile

# Build @cabasvert/server
RUN cd packages/server && yarn compile

# Build @cabasvert/client (browser production bundle)
RUN cd packages/client && node scripts/build.js browser --prod

# ==============================================================================
# Stage 2: Production runtime image
# ==============================================================================
FROM node:14-alpine

ENV NODE_ENV=production \
    SERVER_CONFIG_FILE=/usr/src/app/config.json

WORKDIR /usr/src/app

# Install production dependencies for the server
COPY packages/server/package.json ./
RUN npm install --production

# Copy compiled server files from builder stage
COPY --from=builder /app/packages/server/dist ./dist

# Copy compiled client assets into public/ directory
COPY --from=builder /app/packages/client/www ./public

# Copy default config and metadata
COPY packages/server/config.json ./
COPY packages/server/README.md packages/server/CHANGELOG.md ./
COPY LICENSE ./

# Ensure node user owns the app directory (required for writing public/config.prod.json at runtime)
RUN chown -R node:node /usr/src/app

USER node

EXPOSE 8080

CMD ["/bin/sh", "-c", "node dist/cli --config=${SERVER_CONFIG_FILE} --generate-client-config=${NODE_ENV}"]
