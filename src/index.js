import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Import the router
import { AuthProvider } from './contexts/AuthContext'; // Import our new provider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Makes routing work everywhere */}
      <AuthProvider> {/* Provides user auth state to the whole app */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

