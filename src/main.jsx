import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import '@fontsource/poppins/500.css';
const loadFonts = () => {
  const link = document.createElement('link');
  
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

loadFonts();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
)