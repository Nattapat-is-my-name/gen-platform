FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig*.json ./
COPY index.html ./
COPY components.json ./
COPY src ./src
RUN npm ci && npm run build

EXPOSE 5173

CMD ["npx", "serve", "-s", "dist", "-l", "5173"]