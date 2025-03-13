import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to Pixel Canvas</h1>
        <p className="subtitle">A collaborative pixel art canvas inspired by pxls.space</p>
        <div className="cta-buttons">
          <Link to="/canvas" className="cta-button primary">Start Drawing</Link>
          <Link to="/register" className="cta-button secondary">Create Account</Link>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Collaborative Canvas</h3>
            <p>Join others in creating pixel art on a shared canvas. Place one pixel at a time and watch the artwork evolve.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Cooldown System</h3>
            <p>Strategic pixel placement with a cooldown timer. Stack up to 6 pixels over time for burst creativity.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Template System</h3>
            <p>Use templates to guide your pixel art creation. Upload and share templates with the community.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Advanced Controls</h3>
            <p>Zoom, pan, and navigate the canvas with ease. View pixel history and see who placed each pixel.</p>
          </div>
        </div>
      </div>
      
      <div className="how-it-works">
        <h2>How It Works</h2>
        <ol className="steps">
          <li>
            <span className="step-number">1</span>
            <div className="step-content">
              <h3>Create an Account</h3>
              <p>Sign up to start placing pixels and using all features.</p>
            </div>
          </li>
          <li>
            <span className="step-number">2</span>
            <div className="step-content">
              <h3>Choose a Color</h3>
              <p>Select from our color palette or use the color picker for custom colors.</p>
            </div>
          </li>
          <li>
            <span className="step-number">3</span>
            <div className="step-content">
              <h3>Place Pixels</h3>
              <p>Click on the canvas to place your pixel. Wait for the cooldown to place another.</p>
            </div>
          </li>
          <li>
            <span className="step-number">4</span>
            <div className="step-content">
              <h3>Collaborate</h3>
              <p>Work with others to create amazing pixel art masterpieces!</p>
            </div>
          </li>
        </ol>
      </div>
      
      <div className="join-section">
        <h2>Ready to start creating?</h2>
        <Link to="/canvas" className="cta-button primary">Go to Canvas</Link>
      </div>
    </div>
  );
};

export default HomePage;
