# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage
#
# Node is pinned to an exact patch, not a floating major. Vite 8 declares
# engines ^20.19.0 || >=22.12.0; Railway's Nixpacks image supplied 22.11.0,
# which satisfies neither branch. 20.20.2 matches the machine where the build
# is known to pass and stays inside package.json's "engines": "20.x".
#
# The image is Debian (glibc), not Alpine (musl), on purpose: the build pulls
# @rolldown/binding-linux-x64-gnu, and the -gnu binding needs glibc.
# ---------------------------------------------------------------------------
FROM node:20.20.2-bookworm-slim AS build

WORKDIR /app

# Manifests only, so this layer is reused until dependencies actually change.
COPY package.json package-lock.json ./

# Dev dependencies are required here. Vite pulls rolldown, whose native binding
# is an optional *dev* dependency, and `vite build` cannot run without it.
# Do not add --omit=dev and do not set NODE_ENV=production in this stage.
RUN npm ci

# Source arrives after the dependency layer so edits under src/ do not force a
# reinstall.
COPY . .

# Vite inlines VITE_API_BASE_URL into the bundle at build time, so it has to be
# a real environment variable before `vite build` runs. Setting it at runtime
# does nothing. No domain is hardcoded here -- the caller supplies it.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------------------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------------------
FROM node:20.20.2-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# `serve -s` rewrites any unmatched path to index.html, so client-side routes
# such as /inventory/warehouses resolve instead of returning 404.
# Pinned to the same version package.json depends on.
RUN npm install -g serve@14.2.6

# Only the build output crosses the stage boundary.
COPY --from=build /app/dist ./dist

# Railway injects PORT. The fallback is for local `docker run` without -e PORT.
ENV PORT=3000
EXPOSE 3000

USER node

# Shell form so ${PORT} is expanded at container start rather than build time.
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-3000}"]
