FROM node:22.2.0
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

# Create placeholder .env for build (needed for prisma generate in postinstall)
RUN echo "DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder" > .env

RUN npm i
COPY . .

# patch-package already ran in postinstall, and prisma client was already generated
# Just need to build the app
RUN npm run build

# Clean up placeholder .env
RUN rm -f .env

# Copy and make the entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
