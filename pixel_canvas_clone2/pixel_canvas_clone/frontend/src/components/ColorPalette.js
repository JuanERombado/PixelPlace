import React, { useContext, useState } from 'react';
import { SketchPicker } from 'react-color';
import { CanvasContext } from '../context/CanvasContext';
import { AuthContext } from '../context/AuthContext';
import './ColorPalette.css';

const ColorPalette = () => {
  const { selectedColor, setSelectedColor, cooldown, canPlace, stackedPixels } = useContext(CanvasContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Default color palette
  const defaultColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#8800FF',
    '#FF0088', '#00FF88', '#0088FF', '#88FF00', '#880000',
    '#008800', '#000088', '#888888', '#444444', '#CCCCCC'
  ];

  // Calculate cooldown time remaining
  const getCooldownRemaining = () => {
    if (!cooldown) return 0;
    
    const remaining = Math.max(0, new Date(cooldown) - new Date());
    return Math.ceil(remaining / 1000);
  };

  return (
    <div className="color-palette">
      <div className="palette-header">
        <h3>Color Palette</h3>
        {isAuthenticated && (
          <div className="cooldown-info">
            {canPlace ? (
              <span className="can-place">Ready to place</span>
            ) : (
              <span className="cooldown-active">
                Cooldown: {getCooldownRemaining()}s
              </span>
            )}
            {stackedPixels > 0 && (
              <span className="stacked-pixels">
                Stacked pixels: {stackedPixels}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="default-colors">
        {defaultColors.map((color) => (
          <div
            key={color}
            className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>

      <div className="custom-color">
        <div
          className="current-color"
          style={{ backgroundColor: selectedColor }}
          onClick={() => setShowColorPicker(!showColorPicker)}
        />
        <span>{selectedColor}</span>
        {showColorPicker && (
          <div className="color-picker-popover">
            <div 
              className="color-picker-cover" 
              onClick={() => setShowColorPicker(false)}
            />
            <SketchPicker
              color={selectedColor}
              onChange={(color) => setSelectedColor(color.hex)}
            />
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="login-prompt">
          <p>Log in to place pixels</p>
        </div>
      )}
    </div>
  );
};

export default ColorPalette;
