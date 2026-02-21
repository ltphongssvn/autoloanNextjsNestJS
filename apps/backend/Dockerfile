FROM node:20-alpine AS builder
RUN npm install -g npm@11.10.1
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared-types/package.json packages/shared-types/
RUN npm ci --workspace=apps/backend --workspace=packages/shared-types
COPY packages/shared-types packages/shared-types
COPY apps/backend apps/backend
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
RUN npm run build -w apps/backend

FROM node:20-alpine
RUN npm install -g npm@11.10.1
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/packages/shared-types ./packages/shared-types
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && node apps/backend/dist/main"]
