FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json ./
RUN npm install -g pnpm && pnpm install --prod
CMD ["pnpm", "start"]
