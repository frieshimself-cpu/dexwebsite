FROM node:22-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

# Orders/boosts live in SQLite here — mount a persistent volume at /app/data
VOLUME /app/data

CMD ["npm", "start"]
