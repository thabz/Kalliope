FROM node:20-bullseye-slim AS build

ENV NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY next.config.js routes.js server.js ./
COPY common ./common
COPY components ./components
COPY pages ./pages
COPY public ./public
COPY tools ./tools

FROM node:20-bullseye-slim AS runtime

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NODE_ENV=production
ENV LOCALE=da_DK.UTF_8

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

EXPOSE 3000

CMD ["npm", "start"]

FROM runtime AS static-builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    git config --global --add safe.directory /app && \
    rm -rf /var/lib/apt/lists/*

CMD ["npm", "run", "build-static"]
