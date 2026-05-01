FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm install -D @types/jsonwebtoken @types/nodemailer @types/bcryptjs @types/express @types/cors @types/node-cron
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
