import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';

export const CanvasContext = createContext();

export const CanvasProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [canvasData, setCanvasData] = useState({});
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [cooldown, setCooldown] = useState(null);
  const [canPlace, setCanPlace] = useState(false);
  const [stackedPixels, setStackedPixels] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 500, y: 500 }); // Center of 1000x1000 canvas

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Listen for pixel updates
  useEffect(() => {
    if (socket) {
      socket.on('pixel:update', (data) => {
        setCanvasData(prev => ({
          ...prev,
          [`${data.x},${data.y}`]: data.color
        }));
      });

      socket.on('canvas:reset', () => {
        fetchCanvas();
        toast.info('Canvas has been reset!');
      });
    }
  }, [socket]);

  // Fetch canvas data
  const fetchCanvas = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/canvas');
      setCanvasData(res.data.canvasData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching canvas:', err);
      toast.error('Failed to load canvas data');
      setIsLoading(false);
    }
  };

  // Fetch cooldown status
  const fetchCooldown = async () => {
    if (!isAuthenticated) {
      setCanPlace(false);
      setCooldown(null);
      setStackedPixels(0);
      return;
    }

    try {
      const res = await axios.get('/api/canvas/cooldown');
      setCooldown(new Date(res.data.cooldownEnd));
      setCanPlace(res.data.canPlace);
      setStackedPixels(res.data.stackedPixels);
    } catch (err) {
      console.error('Error fetching cooldown:', err);
    }
  };

  // Place a pixel
  const placePixel = async (x, y) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to place pixels');
      return false;
    }

    if (!canPlace) {
      const timeLeft = Math.ceil((cooldown - Date.now()) / 1000);
      toast.error(`Cooldown active. Wait ${timeLeft} seconds.`);
      return false;
    }

    try {
      const res = await axios.post('/api/canvas/pixel', {
        x,
        y,
        color: selectedColor
      });

      setCooldown(new Date(res.data.cooldownEnd));
      setStackedPixels(res.data.stackedPixels);
      setCanPlace(false);

      // Start cooldown timer
      setTimeout(() => {
        fetchCooldown();
      }, new Date(res.data.cooldownEnd) - Date.now());

      return true;
    } catch (err) {
      console.error('Error placing pixel:', err);
      toast.error(err.response?.data?.message || 'Failed to place pixel');
      return false;
    }
  };

  // Get pixel info
  const getPixelInfo = async (x, y) => {
    try {
      const res = await axios.get(`/api/canvas/pixel/${x}/${y}`);
      return res.data;
    } catch (err) {
      console.error('Error getting pixel info:', err);
      return null;
    }
  };

  // Set active template
  const setTemplate = (template) => {
    setActiveTemplate(template);
  };

  // Clear active template
  const clearTemplate = () => {
    setActiveTemplate(null);
  };

  // Update zoom level
  const updateZoom = (newZoom) => {
    setZoomLevel(Math.max(0.5, Math.min(10, newZoom)));
  };

  // Update position (pan)
  const updatePosition = (newPosition) => {
    setPosition(newPosition);
  };

  // Load initial data
  useEffect(() => {
    fetchCanvas();
  }, []);

  // Update cooldown status periodically
  useEffect(() => {
    fetchCooldown();
    const interval = setInterval(fetchCooldown, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <CanvasContext.Provider
      value={{
        canvasData,
        selectedColor,
        setSelectedColor,
        cooldown,
        canPlace,
        stackedPixels,
        isLoading,
        placePixel,
        getPixelInfo,
        activeTemplate,
        setTemplate,
        clearTemplate,
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
