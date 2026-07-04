import React from 'react';
import { createRoot } from 'react-dom/client';
import App2 from './App2.jsx';
import './styles/global.css';
import './styles/sky.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App2 />
  </React.StrictMode>
);