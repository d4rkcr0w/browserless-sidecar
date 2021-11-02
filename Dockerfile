# Install dependencies only when needed
FROM node:16-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY ./index.js ./index.js

EXPOSE 9000

CMD ["npm", "start"]
