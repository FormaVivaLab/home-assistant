ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.20
FROM ${BUILD_FROM}

RUN apk add --no-cache nodejs

WORKDIR /app
COPY server.js /app/server.js
COPY public /app/public

EXPOSE 8099
CMD ["node", "/app/server.js"]

