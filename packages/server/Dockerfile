FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/
COPY packages/frontend/package.json packages/frontend/
COPY packages/core/package.json packages/core/

RUN npm install

COPY packages/ packages/

RUN npm run build -w @webarcade/frontend
RUN npm run build -w @webarcade/server

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/server/package.json packages/server/
COPY --from=builder /app/packages/core/package.json packages/core/

RUN npm install --omit=dev --workspace=@webarcade/server --workspace=@emulatorjs/emulatorjs

COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/packages/frontend/dist packages/frontend/dist
COPY --from=builder /app/packages/core/data packages/core/data
COPY --from=builder /app/packages/server/src/migrations packages/server/dist/migrations

ENV PORT=3001
ENV FRONTEND_DIST=packages/frontend/dist
ENV CORE_DATA_DIR=packages/core/data

EXPOSE 3001
CMD ["node", "packages/server/dist/index.js"]
