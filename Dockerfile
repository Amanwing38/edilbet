# Production Dockerfile for Edil Bet 24/7 Deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY client/ ./client/
COPY server/ ./server/

# Build client and server
RUN cd client && npm run build
RUN cd server && npm run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Copy built artifacts and runtime dependencies
COPY package.json ./
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json

RUN cd server && npm install --omit=dev

EXPOSE 10000
EXPOSE 3001

CMD ["node", "server/dist/index.js"]
