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

COPY --from=build /app /app

EXPOSE 3000

CMD ["npm", "start"]
