#!/bin/bash

# Setup for Docker deployment
echo "Setting up Docker deployment..."

# Create Docker Compose file
cat > /home/ubuntu/pixel_canvas_clone/docker-compose.yml << 'EOL'
version: '3'

services:
  mongodb:
    image: mongo:latest
    container_name: pixel-canvas-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: pixel-canvas-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGO_URI=mongodb://mongodb:27017/pixel-canvas
      - JWT_SECRET=pixelcanvassecretkey
      - JWT_EXPIRE=30d
    depends_on:
      - mongodb
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: pixel-canvas-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: always

volumes:
  mongo-data:
EOL

# Create Backend Dockerfile
cat > /home/ubuntu/pixel_canvas_clone/backend/Dockerfile << 'EOL'
FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
EOL

# Create Frontend Dockerfile
cat > /home/ubuntu/pixel_canvas_clone/frontend/Dockerfile << 'EOL'
FROM node:16 as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /usr/src/app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOL

# Create Nginx config for frontend
cat > /home/ubuntu/pixel_canvas_clone/frontend/nginx.conf << 'EOL'
server {
    listen 80;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

echo "Docker configuration files created successfully!"
