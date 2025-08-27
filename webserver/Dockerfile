FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies (only production modules)
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --production

# Copy app source
COPY .  .

# Use non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup || true
USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD wget -qO- http://localhost:3000/health || exit 1

CMD [ "node", "index.js" ]
