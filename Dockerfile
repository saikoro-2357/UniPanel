FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.html server.cjs ./

ENV PORT=4173
EXPOSE 4173
CMD ["npm", "start"]

