FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && echo '=== Starting node ===' && node dist/main.js 2>&1; echo \"=== Node exited: $? ===\""]
