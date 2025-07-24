import React from 'react';
import ReactDOM from 'react-dom/client';  // <-- OJO aquí, es 'react-dom/client'
import App from './App';
import './index.css';  // <-- Aquí va tu Tailwind CSS importado

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
