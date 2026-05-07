FROM node:20-alpine AS base

WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "dist/app.js"]
