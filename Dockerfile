FROM node:22.2.0

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

# Build the app
RUN npm run build

# Copy and make the entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
