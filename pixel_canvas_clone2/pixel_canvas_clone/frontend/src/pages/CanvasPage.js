import React, { useContext } from 'react';
import Canvas from '../components/Canvas';
import ColorPalette from '../components/ColorPalette';
import TemplateSelector from '../components/TemplateSelector';
import { CanvasContext } from '../context/CanvasContext';
import './CanvasPage.css';

const CanvasPage = () => {
  const { isLoading } = useContext(CanvasContext);

  return (
    <div className="canvas-page">
      <div className="canvas-wrapper">
        <Canvas />
        <ColorPalette />
        <div className="canvas-controls">
          <div className="zoom-controls">
            <button className="zoom-button">+</button>
            <button className="zoom-button">-</button>
          </div>
          <div className="info-panel">
            <p>Click to place a pixel</p>
            <p>Scroll to zoom in/out</p>
            <p>Middle-click or right-click to pan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasPage;
