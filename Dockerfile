FROM node:22-slim
WORKDIR /app

# Build tools for native modules (better-sqlite3) when prebuilt binaries
# can't be downloaded during the image build.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

# Note: attach a Railway volume at /app/data (dashboard) — SQLite lives there.

CMD ["npm", "start"]
