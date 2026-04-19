FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build
RUN find . -name "*.html" | grep -v node_modules | xargs -I{} sh -c 'mkdir -p dist/$(dirname {}) && cp {} dist/{}'
CMD ["npm", "start"]
