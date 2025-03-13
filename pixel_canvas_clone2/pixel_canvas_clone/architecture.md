# Pixel Canvas Clone Architecture

## Overview
This document outlines the architecture for a clone of pxls.space, a collaborative pixel canvas application where users can place pixels on a shared canvas. The clone will start with a blank canvas and implement the core functionality of the original site.

## System Architecture

### Frontend
- **Technology**: React.js with TypeScript
- **Key Components**:
  - Canvas Component: Renders the pixel canvas using HTML5 Canvas
  - Pixel Placement Interface: Allows users to select colors and place pixels
  - Template System: Allows users to upload and overlay template images
  - User Authentication UI: Login/registration forms
  - Settings Panel: User preferences and controls
  - Information Panel: Rules, FAQ, and help content

### Backend
- **Technology**: Node.js with Express
- **Key Components**:
  - RESTful API: Handles requests for pixel placement, user authentication, etc.
  - WebSocket Server: Provides real-time updates for pixel placements
  - Authentication System: Manages user sessions and permissions
  - Rate Limiting: Implements cooldown system for pixel placement
  - Canvas State Management: Tracks the state of the canvas

### Database
- **Technology**: MongoDB
- **Collections**:
  - Users: Stores user information and authentication details
  - Pixels: Stores the state of each pixel on the canvas
  - PixelHistory: Tracks the history of pixel placements
  - Templates: Stores template information

## Database Schema

### Users Collection
```
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  registrationDate: Date,
  lastLogin: Date,
  pixelsPlaced: Number,
  cooldownEnd: Date,
  stackedPixels: Number
}
```

### Pixels Collection
```
{
  _id: ObjectId,
  x: Number,
  y: Number,
  color: String,
  placedBy: ObjectId (ref: Users),
  placedAt: Date
}
```

### PixelHistory Collection
```
{
  _id: ObjectId,
  x: Number,
  y: Number,
  color: String,
  placedBy: ObjectId (ref: Users),
  placedAt: Date
}
```

### Templates Collection
```
{
  _id: ObjectId,
  title: String,
  imageUrl: String,
  createdBy: ObjectId (ref: Users),
  createdAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Log in an existing user
- `GET /api/auth/logout`: Log out the current user
- `GET /api/auth/status`: Get the current authentication status

### Canvas
- `GET /api/canvas`: Get the current state of the canvas
- `POST /api/canvas/pixel`: Place a pixel on the canvas
- `GET /api/canvas/pixel/:x/:y`: Get information about a specific pixel
- `GET /api/canvas/cooldown`: Get the current cooldown status for the user

### Templates
- `GET /api/templates`: Get a list of available templates
- `POST /api/templates`: Create a new template
- `GET /api/templates/:id`: Get a specific template
- `DELETE /api/templates/:id`: Delete a template

## WebSocket Events

### Server to Client
- `pixel:update`: Sent when a pixel is updated
- `canvas:reset`: Sent when the canvas is reset
- `user:cooldown`: Sent to update a user's cooldown status

### Client to Server
- `pixel:place`: Sent when a user places a pixel

## Cooldown System
- Dynamic cooldown based on number of active users
- Users can stack up to 6 pixels over time (approximately 40 minutes)
- Cooldown time is longer when more users are online

## Canvas Specifications
- Size: 1000x1000 pixels (configurable)
- Color Palette: 16 colors (configurable)
- Canvas resets when completely full or after a set time period

## Security Considerations
- Rate limiting to prevent abuse
- Input validation for all API endpoints
- CORS configuration to restrict access
- Authentication tokens with appropriate expiration
- Sanitization of user inputs

## Deployment Architecture
- Frontend: Static hosting (Netlify, Vercel, or similar)
- Backend: Node.js server on a cloud provider (Heroku, AWS, or similar)
- Database: MongoDB Atlas or similar cloud database service
- WebSockets: Integrated with the backend server

This architecture provides a solid foundation for building a clone of pxls.space with a blank canvas, implementing all the core functionality while allowing for future enhancements and customizations.
