import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CanvasProvider } from '../context/CanvasContext';
import Canvas from '../components/Canvas';

// Mock canvas methods
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  globalAlpha: 1,
  drawImage: jest.fn()
}));

// Mock socket.io
jest.mock('socket.io-client', () => {
  const emit = jest.fn();
  const on = jest.fn();
  const disconnect = jest.fn();
  
  return jest.fn(() => ({
    emit,
    on,
    disconnect
  }));
});

// Mock canvas context values
const mockCanvasContext = {
  canvasData: {
    '100,100': '#FF0000',
    '200,200': '#00FF00'
  },
  selectedColor: '#000000',
  placePixel: jest.fn().mockResolvedValue(true),
  isLoading: false,
  canPlace: true,
  getPixelInfo: jest.fn().mockResolvedValue({
    pixel: {
      x: 100,
      y: 100,
      color: '#FF0000',
      placedBy: { username: 'testuser' },
      placedAt: new Date().toISOString()
    },
    history: []
  }),
  activeTemplate: null,
  zoomLevel: 1,
  updateZoom: jest.fn(),
  position: { x: 500, y: 500 },
  updatePosition: jest.fn()
};

// Mock auth context values
const mockAuthContext = {
  isAuthenticated: true,
  user: { username: 'testuser' }
};

// Wrap Canvas component with necessary providers and mocked context values
const renderCanvas = () => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <CanvasProvider value={mockCanvasContext}>
          <Canvas />
        </CanvasProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Canvas Component', () => {
  test('renders canvas element', () => {
    renderCanvas();
    
    // Canvas should be in the document
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
  
  test('handles mouse movement', () => {
    renderCanvas();
    
    const canvas = document.querySelector('canvas');
    
    // Simulate mouse move
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    
    // Should show coordinates somewhere
    expect(screen.getByText(/X: \d+, Y: \d+/)).toBeInTheDocument();
  });
  
  test('handles click to place pixel', async () => {
    renderCanvas();
    
    const canvas = document.querySelector('canvas');
    
    // Simulate click
    fireEvent.click(canvas);
    
    // Check if placePixel was called
    await waitFor(() => {
      expect(mockCanvasContext.placePixel).toHaveBeenCalled();
    });
  });
  
  test('handles right click to show pixel info', async () => {
    renderCanvas();
    
    const canvas = document.querySelector('canvas');
    
    // Simulate right click
    fireEvent.contextMenu(canvas);
    
    // Check if getPixelInfo was called
    await waitFor(() => {
      expect(mockCanvasContext.getPixelInfo).toHaveBeenCalled();
    });
    
    // Pixel info should be displayed
    await waitFor(() => {
      expect(screen.getByText('Pixel Info')).toBeInTheDocument();
    });
  });
  
  test('handles wheel event for zooming', () => {
    renderCanvas();
    
    const canvas = document.querySelector('canvas');
    
    // Simulate wheel event
    fireEvent.wheel(canvas, { deltaY: -100 });
    
    // Check if updateZoom was called
    expect(mockCanvasContext.updateZoom).toHaveBeenCalled();
  });
});

describe('Canvas Integration with ColorPalette', () => {
  test('selected color is used for pixel placement', async () => {
    // This would be an integration test that verifies the selected color
    // from ColorPalette is used when placing a pixel on the Canvas
    
    // For a complete integration test, we would need to render both components
    // and verify their interaction, but that's beyond the scope of this test file
  });
});
