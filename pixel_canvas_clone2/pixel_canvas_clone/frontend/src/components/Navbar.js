import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Pixel Canvas</Link>
      </div>
      
      <div className="navbar-links">
        <Link to="/canvas" className="nav-link">Canvas</Link>
        <Link to="/templates" className="nav-link">Templates</Link>
        
        {isAuthenticated ? (
          <>
            <span className="username">
              {user?.username}
            </span>
            <button 
              className="logout-button" 
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
