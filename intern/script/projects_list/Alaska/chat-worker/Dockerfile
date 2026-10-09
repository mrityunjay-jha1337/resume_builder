FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma@6.9.0 generate
EXPOSE 4002
CMD ["npm", "start"]
