import React, { useRef, useEffect, useContext, useState } from 'react';
import { CanvasContext } from '../context/CanvasContext';
import { AuthContext } from '../context/AuthContext';
import './Canvas.css';

const Canvas = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [hoveredPixel, setHoveredPixel] = useState(null);
  const [pixelInfo, setPixelInfo] = useState(null);
  
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
  
  const { isAuthenticated } = useContext(AuthContext);

  // Canvas size (1000x1000 pixels by default)
  const canvasSize = 1000;
  const pixelSize = 1; // Base size of each pixel

  // Draw the canvas
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on zoom level
    const scaledSize = canvasSize * pixelSize * zoomLevel;
    canvas.width = scaledSize;
    canvas.height = scaledSize;
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pixels
    Object.entries(canvasData).forEach(([coords, color]) => {
      const [x, y] = coords.split(',').map(Number);
      ctx.fillStyle = color;
      ctx.fillRect(
        x * pixelSize * zoomLevel,
        y * pixelSize * zoomLevel,
        pixelSize * zoomLevel,
        pixelSize * zoomLevel
      );
    });
    
    // Draw grid if zoom level is high enough
    if (zoomLevel >= 4) {
      ctx.strokeStyle = '#DDDDDD';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= canvasSize; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize * zoomLevel, 0);
        ctx.lineTo(x * pixelSize * zoomLevel, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvasSize; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize * zoomLevel);
        ctx.lineTo(canvas.width, y * pixelSize * zoomLevel);
        ctx.stroke();
      }
    }
    
    // Draw template overlay if active
    if (activeTemplate) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
          img,
          activeTemplate.offsetX * pixelSize * zoomLevel,
          activeTemplate.offsetY * pixelSize * zoomLevel,
          img.width * zoomLevel,
          img.height * zoomLevel
        );
        ctx.globalAlpha = 1.0;
      };
      img.src = activeTemplate.imageUrl;
    }
    
    // Draw hovered pixel highlight
    if (hoveredPixel) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoveredPixel.x * pixelSize * zoomLevel,
        hoveredPixel.y * pixelSize * zoomLevel,
        pixelSize * zoomLevel,
        pixelSize * zoomLevel
      );
    }
  }, [canvasData, zoomLevel, position, hoveredPixel, activeTemplate, isLoading]);

  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.5 : 0.5;
    const newZoom = Math.max(0.5, Math.min(20, zoomLevel + delta));
    updateZoom(newZoom);
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (e.button === 1 || e.button === 2) { // Middle or right button
      setIsDragging(true);
      setLastPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse move for dragging and hover
  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = e.clientX - lastPosition.x;
      const deltaY = e.clientY - lastPosition.y;
      
      updatePosition({
        x: position.x - deltaX / zoomLevel,
        y: position.y - deltaY / zoomLevel
      });
      
      setLastPosition({ x: e.clientX, y: e.clientY });
    } else {
      // Calculate hovered pixel
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (pixelSize * zoomLevel));
      const y = Math.floor((e.clientY - rect.top) / (pixelSize * zoomLevel));
      
      if (x >= 0 && x < canvasSize && y >= 0 && y < canvasSize) {
        setHoveredPixel({ x, y });
      } else {
        setHoveredPixel(null);
      }
    }
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave to end dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredPixel(null);
  };

  // Handle click to place pixel
  const handleClick = async (e) => {
    if (!isAuthenticated || !canPlace || !hoveredPixel) return;
    
    const success = await placePixel(hoveredPixel.x, hoveredPixel.y);
    if (success) {
      // Update canvas data immediately for better UX
      const updatedData = { ...canvasData };
      updatedData[`${hoveredPixel.x},${hoveredPixel.y}`] = selectedColor;
    }
  };

  // Handle right click to show pixel info
  const handleContextMenu = async (e) => {
    e.preventDefault();
    
    if (!hoveredPixel) return;
    
    const info = await getPixelInfo(hoveredPixel.x, hoveredPixel.y);
    setPixelInfo(info);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // + key to zoom in
      if (e.key === '+' || e.key === '=') {
        updateZoom(Math.min(20, zoomLevel + 1));
      }
      
      // - key to zoom out
      if (e.key === '-' || e.key === '_') {
        updateZoom(Math.max(0.5, zoomLevel - 1));
      }
      
      // Arrow keys to pan
      if (e.key === 'ArrowUp') {
        updatePosition({ ...position, y: position.y - 10 });
      }
      if (e.key === 'ArrowDown') {
        updatePosition({ ...position, y: position.y + 10 });
      }
      if (e.key === 'ArrowLeft') {
        updatePosition({ ...position, x: position.x - 10 });
      }
      if (e.key === 'ArrowRight') {
        updatePosition({ ...position, x: position.x + 10 });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel, position]);

  return (
    <div className="canvas-container" ref={containerRef}>
      {isLoading ? (
        <div className="loading">Loading canvas...</div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            style={{
              cursor: canPlace && isAuthenticated ? 'crosshair' : 'default',
              transform: `translate(${-position.x * zoomLevel + containerRef.current?.clientWidth / 2}px, ${-position.y * zoomLevel + containerRef.current?.clientHeight / 2}px)`
            }}
          />
          
          {hoveredPixel && (
            <div className="pixel-coordinates">
              X: {hoveredPixel.x}, Y: {hoveredPixel.y}
            </div>
          )}
          
          {pixelInfo && (
            <div className="pixel-info">
              <h3>Pixel Info</h3>
              <p>Placed by: {pixelInfo.pixel.placedBy.username}</p>
              <p>Placed at: {new Date(pixelInfo.pixel.placedAt).toLocaleString()}</p>
              <button onClick={() => setPixelInfo(null)}>Close</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Canvas;
