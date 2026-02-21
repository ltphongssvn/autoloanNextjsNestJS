FROM node:22-alpine AS builder
RUN npm install -g npm@11.10.1
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared-types/package.json packages/shared-types/
RUN npm ci --workspace=apps/frontend --workspace=packages/shared-types
COPY packages/shared-types packages/shared-types
COPY apps/frontend apps/frontend
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
RUN npm run build -w apps/frontend

FROM node:22-alpine
RUN npm install -g npm@11.10.1
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder /app/packages/shared-types ./packages/shared-types
EXPOSE 3000
CMD ["sh", "-c", "cd apps/frontend && ../../node_modules/.bin/next start -p 3000"]
