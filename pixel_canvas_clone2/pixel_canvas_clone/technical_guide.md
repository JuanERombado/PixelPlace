# Pixel Canvas Clone - Technical Implementation Guide

## Overview
This document provides technical details about the implementation of the Pixel Canvas Clone application, intended for developers who want to understand the codebase or contribute to the project.

## Project Structure

```
pixel_canvas_clone/
├── backend/                 # Backend server code
│   ├── controllers/         # Request handlers
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── test/                # Backend tests
│   └── server.js            # Main server file
├── frontend/                # Frontend React application
│   ├── public/              # Static files
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── pages/           # Page components
│   │   ├── test/            # Frontend tests
│   │   ├── App.js           # Main App component
│   │   └── index.js         # Entry point
│   └── package.json         # Frontend dependencies
├── docker-compose.yml       # Docker Compose configuration
├── .env                     # Environment variables
├── deploy.sh                # Standard deployment script
├── docker-deploy.sh         # Docker deployment script
├── run_tests.sh             # Test execution script
└── documentation.md         # User documentation
```

## Backend Implementation

### Server Setup
The backend server is built with Node.js and Express, with Socket.io for real-time communication:

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pixel-canvas');

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle pixel placement
  socket.on('placePixel', (data) => {
    // Broadcast to all clients
    io.emit('pixelUpdate', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/canvas', require('./routes/canvas'));
app.use('/api/templates', require('./routes/templates'));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server, io };
```

### Database Models
The application uses MongoDB with Mongoose for data modeling:

#### User Model
```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  pixelsPlaced: {
    type: Number,
    default: 0
  },
  cooldownEnd: {
    type: Date,
    default: Date.now
  },
  stackedPixels: {
    type: Number,
    default: 0,
    max: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password encryption middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'pixelcanvassecret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user can place pixel
UserSchema.methods.canPlacePixel = function() {
  return this.stackedPixels > 0 || this.cooldownEnd <= new Date();
};

// Update cooldown after placing pixel
UserSchema.methods.updateCooldown = async function(activeUsers) {
  // Calculate cooldown based on active users (30-60 seconds)
  const baseTime = 30;
  const maxAdditionalTime = 30;
  const additionalTime = Math.min(activeUsers / 10, 1) * maxAdditionalTime;
  const cooldownSeconds = baseTime + additionalTime;
  
  if (this.stackedPixels > 0) {
    this.stackedPixels -= 1;
  } else {
    this.cooldownEnd = new Date(Date.now() + cooldownSeconds * 1000);
  }
  
  this.pixelsPlaced += 1;
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
```

#### Pixel Model
```javascript
// models/Pixel.js
const mongoose = require('mongoose');

const PixelSchema = new mongoose.Schema({
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true,
    match: [
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      'Please provide a valid hex color'
    ]
  },
  placedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  placedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for x,y coordinates to ensure uniqueness
PixelSchema.index({ x: 1, y: 1 }, { unique: true });

module.exports = mongoose.model('Pixel', PixelSchema);
```

## Frontend Implementation

### Canvas Component
The core Canvas component handles rendering and interaction with the pixel canvas:

```javascript
// components/Canvas.js
import React, { useRef, useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CanvasContext } from '../context/CanvasContext';
import './Canvas.css';

const Canvas = () => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showPixelInfo, setShowPixelInfo] = useState(false);
  const [pixelInfo, setPixelInfo] = useState(null);
  
  const { isAuthenticated } = useContext(AuthContext);
  const { 
    canvasData, 
    selectedColor, 
    placePixel, 
    isLoading,
    canPlace,
    getPixelInfo,
    activeTemplate,
    zoomLevel,
    updateZoom,
    position,
    updatePosition
  } = useContext(CanvasContext);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Draw canvas
    drawCanvas(ctx);
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawCanvas(ctx);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasData, zoomLevel, position, activeTemplate]);
  
  // Draw canvas function
  const drawCanvas = (ctx) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Apply zoom and position
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-position.x, -position.y);
    
    // Draw grid
    drawGrid(ctx);
    
    // Draw pixels
    drawPixels(ctx);
    
    // Draw template if active
    if (activeTemplate) {
      drawTemplate(ctx);
    }
    
    // Draw hover indicator
    drawHoverIndicator(ctx);
    
    ctx.restore();
  };
  
  // Handle mouse movement
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to canvas coordinates
    const canvasX = Math.floor((x - canvas.width / 2) / zoomLevel + position.x);
    const canvasY = Math.floor((y - canvas.height / 2) / zoomLevel + position.y);
    
    setMousePos({ x: canvasX, y: canvasY });
  };
  
  // Handle canvas click
  const handleCanvasClick = async (e) => {
    if (!isAuthenticated) {
      alert('Please log in to place pixels');
      return;
    }
    
    if (!canPlace) {
      alert('You must wait for the cooldown to expire');
      return;
    }
    
    const { x, y } = mousePos;
    
    try {
      await placePixel(x, y, selectedColor);
    } catch (error) {
      console.error('Error placing pixel:', error);
    }
  };
  
  // Handle right click for pixel info
  const handleContextMenu = async (e) => {
    e.preventDefault();
    
    const { x, y } = mousePos;
    
    try {
      const info = await getPixelInfo(x, y);
      setPixelInfo(info);
      setShowPixelInfo(true);
    } catch (error) {
      console.error('Error getting pixel info:', error);
    }
  };
  
  // Handle wheel event for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    
    const delta = -Math.sign(e.deltaY);
    const factor = delta > 0 ? 1.1 : 0.9;
    
    updateZoom(zoomLevel * factor);
  };
  
  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
      
      <div className="coordinates">
        X: {mousePos.x}, Y: {mousePos.y}
      </div>
      
      {showPixelInfo && pixelInfo && (
        <div className="pixel-info">
          <h3>Pixel Info</h3>
          <p>Color: {pixelInfo.pixel.color}</p>
          <p>Placed by: {pixelInfo.pixel.placedBy.username}</p>
          <p>Placed at: {new Date(pixelInfo.pixel.placedAt).toLocaleString()}</p>
          <button onClick={() => setShowPixelInfo(false)}>Close</button>
        </div>
      )}
      
      {isLoading && (
        <div className="loading">Loading...</div>
      )}
    </div>
  );
};

export default Canvas;
```

### Canvas Context
The CanvasContext provides state management for the canvas:

```javascript
// context/CanvasContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const CanvasContext = createContext();

export const CanvasProvider = ({ children }) => {
  const [canvasData, setCanvasData] = useState({});
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isLoading, setIsLoading] = useState(true);
  const [canPlace, setCanPlace] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState(null);
  const [stackedPixels, setStackedPixels] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 500, y: 500 });
  
  const { isAuthenticated, token } = useContext(AuthContext);
  
  // Connect to socket
  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    
    // Listen for pixel updates
    socket.on('pixelUpdate', (data) => {
      setCanvasData(prevData => ({
        ...prevData,
        [`${data.x},${data.y}`]: data.color
      }));
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);
  
  // Fetch initial canvas data
  useEffect(() => {
    const fetchCanvasData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get('/api/canvas');
        setCanvasData(res.data.canvasData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching canvas data:', error);
        setIsLoading(false);
      }
    };
    
    fetchCanvasData();
  }, []);
  
  // Check cooldown status
  useEffect(() => {
    const checkCooldown = async () => {
      if (!isAuthenticated) {
        setCanPlace(false);
        return;
      }
      
      try {
        const res = await axios.get('/api/canvas/cooldown', {
          headers: {
            'x-auth-token': token
          }
        });
        
        setCooldownEnd(new Date(res.data.cooldownEnd));
        setStackedPixels(res.data.stackedPixels);
        setCanPlace(res.data.canPlace);
      } catch (error) {
        console.error('Error checking cooldown:', error);
      }
    };
    
    checkCooldown();
    
    // Check cooldown every second
    const interval = setInterval(checkCooldown, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);
  
  // Place pixel
  const placePixel = async (x, y, color) => {
    if (!isAuthenticated || !canPlace) {
      return false;
    }
    
    try {
      const res = await axios.post('/api/canvas/pixel', 
        { x, y, color },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      // Update canvas data
      setCanvasData(prevData => ({
        ...prevData,
        [`${x},${y}`]: color
      }));
      
      // Update cooldown
      setCooldownEnd(new Date(res.data.cooldownEnd));
      setStackedPixels(res.data.stackedPixels);
      setCanPlace(res.data.canPlace);
      
      return true;
    } catch (error) {
      console.error('Error placing pixel:', error);
      return false;
    }
  };
  
  // Get pixel info
  const getPixelInfo = async (x, y) => {
    try {
      const res = await axios.get(`/api/canvas/pixel/${x}/${y}`);
      return res.data;
    } catch (error) {
      console.error('Error getting pixel info:', error);
      return null;
    }
  };
  
  // Update zoom level
  const updateZoom = (newZoom) => {
    // Limit zoom level
    const limitedZoom = Math.max(0.1, Math.min(10, newZoom));
    setZoomLevel(limitedZoom);
  };
  
  // Update position
  const updatePosition = (newPosition) => {
    setPosition(newPosition);
  };
  
  return (
    <CanvasContext.Provider
      value={{
        canvasData,
        selectedColor,
        setSelectedColor,
        placePixel,
        isLoading,
        canPlace,
        cooldownEnd,
        stackedPixels,
        getPixelInfo,
        activeTemplate,
        setActiveTemplate,
        zoomLevel,
        updateZoom,
        position,
        updatePosition
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};
```

## Deployment Details

### Docker Compose Configuration
The Docker Compose setup creates three containers:

1. MongoDB database
2. Node.js backend
3. Nginx frontend server

```yaml
# docker-compose.yml
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
```

## Testing Strategy

The application includes comprehensive tests:

1. **Backend Model Tests**: Verify database models and their methods
2. **Backend API Tests**: Test API endpoints and authentication
3. **Frontend Component Tests**: Verify React components render correctly
4. **Canvas Tests**: Test canvas rendering and interaction
5. **End-to-End Tests**: Verify full application workflow

## Performance Considerations

1. **Canvas Rendering**: The canvas uses efficient rendering techniques to handle large numbers of pixels
2. **Real-time Updates**: Socket.io is used for instant pixel updates across all clients
3. **Database Indexing**: MongoDB indexes are used for fast pixel lookups
4. **Cooldown System**: Prevents server overload by limiting pixel placement frequency
5. **Caching**: Canvas state is cached to reduce database queries

## Security Measures

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: Bcrypt is used to securely hash passwords
3. **Input Validation**: All user inputs are validated before processing
4. **CORS Configuration**: Properly configured Cross-Origin Resource Sharing
5. **Rate Limiting**: API rate limiting to prevent abuse

## Future Enhancements

1. **Chat System**: Add real-time chat for user communication
2. **Moderation Tools**: Add tools for moderators to manage content
3. **Canvas History**: Add ability to view canvas evolution over time
4. **Mobile App**: Develop native mobile applications
5. **Multiple Canvases**: Support multiple concurrent canvases
