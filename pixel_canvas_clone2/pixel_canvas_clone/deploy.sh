#!/bin/bash

# Setup MongoDB
echo "Setting up MongoDB..."
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Install backend dependencies and build
echo "Setting up backend..."
cd /home/ubuntu/pixel_canvas_clone/backend
npm install
npm install pm2 -g

# Install frontend dependencies and build
echo "Setting up frontend..."
cd /home/ubuntu/pixel_canvas_clone/frontend
npm install
npm run build

# Start backend server with PM2
echo "Starting backend server..."
cd /home/ubuntu/pixel_canvas_clone/backend
pm2 start server.js --name pixel-canvas-backend

# Serve frontend with a simple HTTP server
echo "Starting frontend server..."
cd /home/ubuntu/pixel_canvas_clone/frontend/build
pm2 start "npx serve -s -l 3000" --name pixel-canvas-frontend

echo "Deployment complete!"
echo "Backend running on port 5000"
echo "Frontend running on port 3000"
