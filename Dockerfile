FROM node:20-bullseye-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

FROM node:20-bullseye-slim AS runtime

WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=4096

ENV NODE_ENV=production
ENV LOCALE=da_DK.UTF_8

RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates && \
    git config --global --add safe.directory /app && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

EXPOSE 3000

CMD ["npm", "start"]
