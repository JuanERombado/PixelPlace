require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const canvasRoutes = require('./routes/canvas');
const templateRoutes = require('./routes/templates');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/canvas', canvasRoutes);
app.use('/api/templates', templateRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Pixel Canvas API is running');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle pixel placement
  socket.on('pixel:place', (data) => {
    // Process pixel placement (will be implemented in canvas controller)
    // Broadcast the update to all clients
    io.emit('pixel:update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pixel-canvas', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Export io for use in other files
module.exports = { io };
