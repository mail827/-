FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl ffmpeg curl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
COPY fonts /app/fonts
COPY assets /app/assets
RUN npm run build

RUN npm prune --production

EXPOSE 8080
CMD ["node", "dist/index.js"]
