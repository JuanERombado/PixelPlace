#!/bin/bash

echo "===== Starting Pixel Canvas Clone ====="

# Check if MongoDB is running
echo "Checking MongoDB status..."
if command -v mongod &> /dev/null; then
    echo "MongoDB is installed."
else
    echo "MongoDB is not installed. Some features may not work correctly."
fi

# Start backend server
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend server
echo "Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "Pixel Canvas Clone is running!"
echo "- Backend: http://localhost:5000"
echo "- Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers."

# Wait for user to press Ctrl+C
wait $BACKEND_PID $FRONTEND_PID
