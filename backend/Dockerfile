FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4000
CMD ["sh", "-c", "echo '=== /app contents ===' && ls /app && echo '=== /app/dist ===' && ls /app/dist 2>/dev/null || echo 'NO DIST FOLDER' && npx prisma migrate deploy && node dist/main"]
