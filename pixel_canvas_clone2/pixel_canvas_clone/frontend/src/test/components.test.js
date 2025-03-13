import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CanvasProvider } from '../context/CanvasContext';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Navbar from '../components/Navbar';
import ColorPalette from '../components/ColorPalette';

// Mock axios
jest.mock('axios');

// Wrap components with necessary providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CanvasProvider>
          {component}
        </CanvasProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  test('renders login form', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText('Login to Pixel Canvas')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  test('handles input changes', () => {
    renderWithProviders(<LoginPage />);
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });
});

describe('RegisterPage', () => {
  test('renders registration form', () => {
    renderWithProviders(<RegisterPage />);
    
    expect(screen.getByText('Register for Pixel Canvas')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });
  
  test('validates password match', () => {
    renderWithProviders(<RegisterPage />);
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const registerButton = screen.getByRole('button', { name: /register/i });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    
    fireEvent.click(registerButton);
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });
});

describe('Navbar', () => {
  test('renders navbar with correct links when not authenticated', () => {
    renderWithProviders(<Navbar />);
    
    expect(screen.getByText('Pixel Canvas')).toBeInTheDocument();
    expect(screen.getByText('Canvas')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });
});

describe('ColorPalette', () => {
  test('renders color palette with default colors', () => {
    renderWithProviders(<ColorPalette />);
    
    expect(screen.getByText('Color Palette')).toBeInTheDocument();
    
    // Check for login prompt when not authenticated
    expect(screen.getByText('Log in to place pixels')).toBeInTheDocument();
    
    // Check for color swatches (at least one should be present)
    const colorSwatches = document.querySelectorAll('.color-swatch');
    expect(colorSwatches.length).toBeGreaterThan(0);
  });
});
