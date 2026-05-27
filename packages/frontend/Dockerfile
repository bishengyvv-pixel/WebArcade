FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/core/package.json packages/core/

RUN npm install --workspace=@webarcade/frontend

COPY packages/frontend/ packages/frontend/
COPY packages/core/ packages/core/

RUN npm run --workspace=@webarcade/frontend build

FROM nginx:alpine

COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
