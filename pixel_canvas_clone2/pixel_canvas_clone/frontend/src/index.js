import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CanvasProvider } from './context/CanvasContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CanvasProvider>
          <App />
          <ToastContainer position="bottom-right" />
        </CanvasProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
