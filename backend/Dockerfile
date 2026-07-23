FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npx tsc -p tsconfig.json && echo "=== TSC DONE ===" && ls -la dist/main.js

EXPOSE 4000
CMD ["node", "dist/main.js"]
