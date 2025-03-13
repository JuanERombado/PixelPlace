# Pixel Canvas Clone - Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
   - [Standard Deployment](#standard-deployment)
   - [Docker Deployment](#docker-deployment)
4. [Usage Guide](#usage-guide)
5. [Architecture](#architecture)
6. [API Documentation](#api-documentation)
7. [Troubleshooting](#troubleshooting)

## Introduction

Pixel Canvas Clone is a collaborative pixel art canvas inspired by pxls.space. It allows users to place pixels one at a time on a shared canvas, creating collaborative artwork with other users. The application features a cooldown system, template overlay functionality, and user authentication.

## Features

- **Collaborative Canvas**: Place pixels on a shared canvas visible to all users
- **Cooldown System**: Strategic pixel placement with cooldown timer between placements
- **Pixel Stacking**: Accumulate up to 6 pixels over time for burst creativity
- **User Authentication**: Register and login to track your contributions
- **Template System**: Upload and use templates to guide your pixel art creation
- **Zoom and Pan Controls**: Navigate the canvas with intuitive controls
- **Pixel History**: View who placed each pixel and when
- **Color Palette**: Choose from a variety of colors for your pixels
- **Responsive Design**: Works on desktop and mobile devices

## Installation

### System Requirements
- Node.js 14+ and npm
- MongoDB
- Modern web browser

### Standard Deployment

1. Clone the repository:
```
git clone https://github.com/yourusername/pixel-canvas-clone.git
cd pixel-canvas-clone
```

2. Run the deployment script:
```
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Install and configure MongoDB
- Install backend dependencies
- Build the frontend
- Start the backend server using PM2
- Serve the frontend using a simple HTTP server

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Docker Deployment

1. Clone the repository:
```
git clone https://github.com/yourusername/pixel-canvas-clone.git
cd pixel-canvas-clone
```

2. Run the Docker deployment script:
```
chmod +x docker-deploy.sh
./docker-deploy.sh
```

3. Start the containers:
```
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage Guide

### Registration and Login

1. Click "Register" in the navigation bar
2. Fill in the registration form with username, email, and password
3. Submit the form to create your account
4. You'll be automatically logged in after registration
5. For future sessions, use the "Login" option with your credentials

### Canvas Navigation

- **Pan**: Click and drag, or use arrow keys/WASD
- **Zoom**: Scroll wheel, or use +/- buttons
- **Place Pixel**: Click on the canvas after selecting a color
- **View Pixel Info**: Right-click or shift-click on a pixel

### Placing Pixels

1. Select a color from the color palette
2. Click on the canvas where you want to place your pixel
3. Wait for the cooldown timer to expire before placing another pixel
4. You can stack up to 6 pixels over time (approximately 40 minutes for full stack)

### Using Templates

1. Navigate to the Templates page
2. Create a new template by providing a title and image URL
3. Use an existing template by clicking "Use Template"
4. Adjust template position and opacity on the canvas
5. Follow the template outline to place your pixels

## Architecture

The application follows a modern full-stack architecture:

### Frontend
- **Framework**: React.js
- **State Management**: React Context API
- **Real-time Updates**: Socket.io client
- **Styling**: CSS with component-scoped styles

### Backend
- **Server**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.io

### Data Models
- **User**: Stores user information and cooldown status
- **Pixel**: Represents current state of each pixel on the canvas
- **PixelHistory**: Tracks history of all pixel placements
- **Template**: Stores template information for overlay guidance

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login an existing user
- `GET /api/auth/me`: Get current user information

### Canvas Endpoints

- `GET /api/canvas`: Get current canvas state
- `POST /api/canvas/pixel`: Place a pixel on the canvas
- `GET /api/canvas/pixel/:x/:y`: Get information about a specific pixel
- `GET /api/canvas/cooldown`: Get current user's cooldown status

### Template Endpoints

- `GET /api/templates`: Get all public templates
- `GET /api/templates/my`: Get current user's templates
- `POST /api/templates`: Create a new template
- `GET /api/templates/:id`: Get a specific template
- `DELETE /api/templates/:id`: Delete a template

## Troubleshooting

### Common Issues

1. **Cannot connect to the application**
   - Ensure MongoDB is running
   - Check if the backend server is running on port 5000
   - Verify the frontend server is running on port 3000

2. **Cannot place pixels**
   - Ensure you are logged in
   - Check if you have an active cooldown
   - Verify your internet connection

3. **Template not showing**
   - Check if the template URL is valid and accessible
   - Ensure the template is properly positioned on the canvas
   - Adjust template opacity if it's too transparent

### Getting Help

If you encounter any issues not covered in this documentation, please:
1. Check the console logs for error messages
2. Restart the application
3. Contact support at support@pixelcanvas.example.com
