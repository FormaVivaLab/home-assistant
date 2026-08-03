ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.20
FROM ${BUILD_FROM}

RUN apk add --no-cache nodejs npm

WORKDIR /app
COPY server.js /app/server.js
COPY package.json /app/package.json
COPY public /app/public

RUN npm ci --omit=dev

EXPOSE 8099
CMD ["node", "/app/server.js"]
