FROM node:22.2.0
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

# Create placeholder .env for build (needed for prisma generate in postinstall)
RUN printf 'DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder\n\
NEXTAUTH_SECRET=placeholder\n\
NEXTAUTH_URL=http://localhost:3000\n\
IMAGEKIT_PUBLIC_KEY=placeholder\n\
IMAGEKIT_PRIVATE_KEY=placeholder\n\
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://placeholder.com\n\
IMAGEKIT_BASE_FOLDER=placeholder\n' > .env

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
